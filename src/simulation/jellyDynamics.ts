export type Vec3Tuple = [number, number, number];

export type JellyPhysicsConfig = {
  fixedStep: number;
  maxFrameTime: number;
  stiffness: number;
  damping: number;
  dragCompliance: number;
  sloshStiffness: number;
  sloshDamping: number;
  spinDamping: number;
  contactStiffness: number;
  contactDamping: number;
  torsionStiffness: number;
  torsionDamping: number;
};

export type JellyDynamicsInput = {
  dragX: number;
  dragY: number;
  dragging: boolean;
  idleTarget: number;
  motionScale: number;
  /** Local pressure is separate from drag distance: a held touch compresses
   * the shell before a pull stretches it. */
  contactStrength?: number;
  /** Positive values pinch inward; negative values pull the contact group apart. */
  squeeze?: number;
  /** Signed in-plane rotation of a multi-contact group. */
  twist?: number;
};

export type JellyDynamicsState = {
  /** Logarithmic axial stretch. Perpendicular scale is derived to preserve volume. */
  strain: number;
  strainVelocity: number;
  axis: Vec3Tuple;
  bend: Vec3Tuple;
  slosh: Vec3Tuple;
  angularOffset: [number, number];
  torsion: number;
  torsionVelocity: number;
  contactPressure: number;
  kineticEnergy: number;
};

const DEFAULT_CONFIG: JellyPhysicsConfig = {
  fixedStep: 1 / 120,
  maxFrameTime: 1 / 15,
  stiffness: 19,
  damping: 4.15,
  dragCompliance: 0.62,
  sloshStiffness: 8.4,
  sloshDamping: 1.95,
  spinDamping: 0.86,
  contactStiffness: 28,
  contactDamping: 7.2,
  torsionStiffness: 14,
  torsionDamping: 4.6,
};

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

const length3 = (value: Vec3Tuple) =>
  Math.hypot(value[0], value[1], value[2]);

const normalize3 = (value: Vec3Tuple): Vec3Tuple => {
  const length = Math.max(1e-6, length3(value));
  return [value[0] / length, value[1] / length, value[2] / length];
};

/**
 * Small modal viscoelastic simulation for the hero orb. It is deliberately not
 * a particle fluid: a handful of coupled modes gives the material convincing
 * weight while keeping the render budget available for the raymarch.
 */
export class JellyDynamics {
  readonly state: JellyDynamicsState = {
    strain: 0,
    strainVelocity: 0,
    axis: [0, 1, 0],
    bend: [0, 0, 0],
    slosh: [0, 0, 0],
    angularOffset: [0, 0],
    torsion: 0,
    torsionVelocity: 0,
    contactPressure: 0,
    kineticEnergy: 0,
  };

  private readonly config: JellyPhysicsConfig;
  private accumulator = 0;
  private bendVelocity: Vec3Tuple = [0, 0, 0];
  private sloshVelocity: Vec3Tuple = [0, 0, 0];
  private angularVelocity: [number, number] = [0, 0];
  private pressureVelocity = 0;
  private phase = 0;

  constructor(config: Partial<JellyPhysicsConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  reset() {
    this.state.strain = 0;
    this.state.strainVelocity = 0;
    this.state.axis[0] = 0;
    this.state.axis[1] = 1;
    this.state.axis[2] = 0;
    this.state.bend.fill(0);
    this.state.slosh.fill(0);
    this.state.angularOffset.fill(0);
    this.state.torsion = 0;
    this.state.torsionVelocity = 0;
    this.state.contactPressure = 0;
    this.state.kineticEnergy = 0;
    this.accumulator = 0;
    this.bendVelocity.fill(0);
    this.sloshVelocity.fill(0);
    this.angularVelocity.fill(0);
    this.pressureVelocity = 0;
    this.phase = 0;
  }

  setAxis(axis: Vec3Tuple) {
    const normalized = normalize3(axis);
    const blend = 0.32;
    this.state.axis = normalize3([
      this.state.axis[0] + (normalized[0] - this.state.axis[0]) * blend,
      this.state.axis[1] + (normalized[1] - this.state.axis[1]) * blend,
      this.state.axis[2] + (normalized[2] - this.state.axis[2]) * blend,
    ]);
  }

  applyImpulse(axis: Vec3Tuple, strength = 1) {
    this.setAxis(axis);
    const amount = clamp(strength, 0, 2.2);
    this.state.strainVelocity += amount * 2.35;
    this.pressureVelocity += amount * 2.8;
    this.sloshVelocity[0] -= this.state.axis[0] * amount * 1.4;
    this.sloshVelocity[1] -= this.state.axis[1] * amount * 1.4;
    this.sloshVelocity[2] -= this.state.axis[2] * amount * 0.8;
  }

  applyCompression(axis: Vec3Tuple, strength = 1) {
    this.setAxis(axis);
    const amount = clamp(strength, 0, 1.4);
    this.state.strainVelocity -= amount * 1.72;
    this.pressureVelocity += amount * 3.35;
    this.sloshVelocity[0] += this.state.axis[0] * amount * 0.72;
    this.sloshVelocity[1] += this.state.axis[1] * amount * 0.72;
    this.sloshVelocity[2] += this.state.axis[2] * amount * 0.52;
  }

  applyFlick(x: number, y: number, strength = 1) {
    const amount = clamp(strength, 0, 1.6);
    this.setAxis([x, -y, 0.42]);
    this.angularVelocity[0] = clamp(
      this.angularVelocity[0] - y * amount * 5.2,
      -3.5,
      3.5,
    );
    this.angularVelocity[1] = clamp(
      this.angularVelocity[1] + x * amount * 6.2,
      -3.5,
      3.5,
    );
    this.state.strainVelocity += Math.hypot(x, y) * amount * 2.8;
    this.sloshVelocity[0] += x * amount * 4.15;
    this.sloshVelocity[1] -= y * amount * 4.15;
    this.bendVelocity[0] += x * amount * 1.08;
    this.bendVelocity[1] -= y * amount * 1.08;
  }

  advance(frameTime: number, input: JellyDynamicsInput) {
    this.accumulator += Math.min(Math.max(frameTime, 0), this.config.maxFrameTime);
    while (this.accumulator >= this.config.fixedStep) {
      this.step(this.config.fixedStep, input);
      this.accumulator -= this.config.fixedStep;
    }
    return this.state;
  }

  private step(dt: number, input: JellyDynamicsInput) {
    this.phase += dt;
    const motion = clamp(input.motionScale, 0, 1);
    const dragMagnitude = Math.hypot(input.dragX, input.dragY);
    const contactStrength = clamp(input.contactStrength ?? 0, 0, 1);
    const squeeze = clamp(input.squeeze ?? 0, -0.48, 0.82);
    const twist = clamp(input.twist ?? 0, -1.1, 1.1);
    const strainTarget = clamp(
      input.idleTarget * motion +
        (input.dragging
          ? dragMagnitude * this.config.dragCompliance -
            contactStrength * 0.1 -
            squeeze * 0.38
          : 0),
      -0.12,
      0.3,
    );

    const strainAcceleration =
      (strainTarget - this.state.strain) * this.config.stiffness -
      this.state.strainVelocity * this.config.damping;
    this.state.strainVelocity += strainAcceleration * dt;
    this.state.strain += this.state.strainVelocity * dt;
    this.state.strain = clamp(this.state.strain, -0.22, 0.34);

    const idleBend: Vec3Tuple = input.dragging
      ? [0, 0, 0]
      : [
          Math.sin(this.phase * 0.43) * 0.05 * motion,
          Math.cos(this.phase * 0.31 + 0.7) * 0.04 * motion,
          Math.sin(this.phase * 0.23 + 1.4) * 0.026 * motion,
        ];
    const bendTarget: Vec3Tuple = input.dragging
      ? [input.dragX * 0.58, -input.dragY * 0.58, dragMagnitude * 0.1]
      : [
          idleBend[0] + this.state.slosh[0] * 0.12,
          idleBend[1] + this.state.slosh[1] * 0.12,
          idleBend[2] + this.state.slosh[2] * 0.08,
        ];
    const sloshTarget: Vec3Tuple = [
      -input.dragX * 0.3 + Math.sin(this.phase * 0.37) * 0.028 * motion,
      input.dragY * 0.3 + Math.cos(this.phase * 0.29) * 0.024 * motion,
      -this.state.strain * 0.24 +
        squeeze * 0.12 +
        Math.sin(this.phase * 0.21) * 0.018 * motion,
    ];

    for (let index = 0; index < 3; index += 1) {
      const bendAcceleration =
        (bendTarget[index] - this.state.bend[index]) * 13.5 -
        this.bendVelocity[index] * 4.6;
      this.bendVelocity[index] += bendAcceleration * dt;
      this.state.bend[index] += this.bendVelocity[index] * dt;

      const sloshAcceleration =
        (sloshTarget[index] - this.state.slosh[index]) * this.config.sloshStiffness -
        this.sloshVelocity[index] * this.config.sloshDamping;
      this.sloshVelocity[index] += sloshAcceleration * dt;
      this.state.slosh[index] += this.sloshVelocity[index] * dt;
      this.state.slosh[index] = clamp(this.state.slosh[index], -0.42, 0.42);
    }

    const pressureTarget =
      (contactStrength * 0.24 + Math.max(0, squeeze) * 0.38) * motion;
    const pressureAcceleration =
      (pressureTarget - this.state.contactPressure) * this.config.contactStiffness -
      this.pressureVelocity * this.config.contactDamping;
    this.pressureVelocity += pressureAcceleration * dt;
    this.state.contactPressure += this.pressureVelocity * dt;
    this.state.contactPressure = clamp(this.state.contactPressure, 0, 0.42);

    const torsionTarget = input.dragging ? twist * 0.68 * motion : 0;
    const torsionAcceleration =
      (torsionTarget - this.state.torsion) * this.config.torsionStiffness -
      this.state.torsionVelocity * this.config.torsionDamping;
    this.state.torsionVelocity += torsionAcceleration * dt;
    this.state.torsion += this.state.torsionVelocity * dt;
    this.state.torsion = clamp(this.state.torsion, -0.82, 0.82);

    const spinDecay = Math.exp(-this.config.spinDamping * dt);
    this.angularVelocity[0] *= spinDecay;
    this.angularVelocity[1] *= spinDecay;
    this.state.angularOffset[0] += this.angularVelocity[0] * dt;
    this.state.angularOffset[1] += this.angularVelocity[1] * dt;

    const velocityEnergy =
      this.state.strainVelocity * this.state.strainVelocity * 0.08 +
      length3(this.sloshVelocity) ** 2 * 0.06 +
      length3(this.bendVelocity) ** 2 * 0.1 +
      (this.angularVelocity[0] ** 2 + this.angularVelocity[1] ** 2) * 0.025 +
      this.state.torsionVelocity * this.state.torsionVelocity * 0.035;
    const potentialEnergy =
      this.state.strain * this.state.strain * 1.6 +
      length3(this.state.bend) ** 2 * 1.2 +
      this.state.torsion * this.state.torsion * 0.32 +
      this.state.contactPressure * this.state.contactPressure * 0.8;
    this.state.kineticEnergy = clamp(velocityEnergy + potentialEnergy, 0, 1.5);
  }
}

export function volumeScaleFromStrain(strain: number): Vec3Tuple {
  const axial = Math.exp(strain);
  const perpendicular = Math.exp(-strain * 0.5);
  return [perpendicular, perpendicular, axial];
}
