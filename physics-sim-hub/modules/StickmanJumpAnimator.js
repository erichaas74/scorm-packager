(function (global) {
  "use strict";

  const SIZES = {
    stroke: 11,
    headRadius: 35,
    neck: 34,
    torso: 125,
    shoulderWidth: 81,
    hipWidth: 62,
    upperArm: 72,
    forearm: 66,
    hand: 14,
    upperLeg: 105,
    lowerLeg: 98,
    foot: 38
  };

  const REST_POSE = {
    rootX: 450,
    rootY: 330,
    torsoLean: -2,
    leftShoulder: 46,
    rightShoulder: 46,
    leftElbow: -101,
    rightElbow: -101,
    leftHip: 1,
    rightHip: 1,
    leftKnee: -4,
    rightKnee: -4,
    leftAnkle: -4,
    rightAnkle: -4
  };

  const SQUAT_POSE = {
    rootX: 435,
    rootY: 412,
    torsoLean: -4,
    leftShoulder: 42,
    rightShoulder: 42,
    leftElbow: -86,
    rightElbow: -86,
    leftHip: 60,
    rightHip: 60,
    leftKnee: 124,
    rightKnee: 124,
    leftAnkle: 1,
    rightAnkle: 1
  };

  const TAKEOFF_POSE = {
    rootX: 450,
    rootY: 270,
    torsoLean: 1,
    leftShoulder: 118,
    rightShoulder: 118,
    leftElbow: 30,
    rightElbow: 30,
    leftHip: 12,
    rightHip: 12,
    leftKnee: 14,
    rightKnee: 14,
    leftAnkle: -28,
    rightAnkle: -28
  };

  const POSE_KEYS = Object.keys(REST_POSE);
  const LANDING_POSE = blendPose(REST_POSE, SQUAT_POSE, 0.45);

  function createStickmanJumpAnimator(ctx, options) {
    return new StickmanJumpAnimator(ctx, options);
  }

  class StickmanJumpAnimator {
    constructor(ctx, options) {
      this.ctx = ctx;
      this.options = Object.assign({
        height: 175,
        pixelsPerMeter: 180,
        idleColor: "#64748b",
        lineColor: "#111827",
        forceColor: "#f59e0b",
        bendScale: 1,
        jumpHeightScale: 1,
        showShadow: true,
        showForceArrow: true
      }, options || {});
    }

    setOptions(options) {
      Object.assign(this.options, options || {});
      return this;
    }

    drawJumpState(jumpState) {
      const state = Object.assign({}, jumpState || {});
      const profile = state.profile || {};
      const contactTime = numberOr(state.contactTime, profile.contactTime, 0.3);
      const depth = bendDepthForState(state, profile, contactTime, this.options);
      const pushProgress = clamp(numberOr(state.pushProgress, 0), 0, 1);
      const jumpHeightScale = numberOr(state.jumpHeightScale, profile.jumpHeightScale, this.options.jumpHeightScale, 1);
      const athleteY = Math.max(0, numberOr(state.athleteY, 0) * jumpHeightScale);
      const pixelsPerMeter = numberOr(state.pixelsPerMeter, this.options.pixelsPerMeter);
      const groundY = numberOr(state.groundY, this.options.groundY, 0);
      const x = numberOr(state.x, this.options.x, 0);
      const color = state.color || profile.color || this.options.idleColor;
      const pose = poseForState(state.state || "idle", pushProgress, depth);
      const bodyHeight = numberOr(state.height, this.options.height);
      const visualGroundY = groundY - athleteY * pixelsPerMeter;

      this.drawPose(pose, {
        x,
        groundY: visualGroundY,
        height: bodyHeight,
        color,
        active: state.state !== "idle",
        shadowGroundY: groundY,
        shadowLift: athleteY,
        currentForce: numberOr(state.currentForce, 0),
        weight: numberOr(state.weight, 0),
        showForceArrow: state.showForceArrow !== false && this.options.showForceArrow
      });
    }

    drawPose(pose, drawOptions) {
      const ctx = this.ctx;
      const points = calcPose(pose, SIZES);
      const bounds = getBounds(points);
      const naturalHeight = Math.max(1, bounds.maxY - bounds.minY);
      const desiredHeight = numberOr(drawOptions.height, this.options.height, 175);
      const scale = numberOr(drawOptions.scale, desiredHeight / naturalHeight);
      const stroke = Math.max(3, SIZES.stroke * scale);
      const root = points.root;
      const drawX = numberOr(drawOptions.x, this.options.x, 0);
      const drawGroundY = numberOr(drawOptions.groundY, this.options.groundY, 0);
      const offsetX = drawX - root.x * scale;
      const offsetY = drawGroundY - bounds.maxY * scale;
      const color = drawOptions.active ? drawOptions.color : this.options.idleColor;

      const toScreen = point => ({
        x: offsetX + point.x * scale,
        y: offsetY + point.y * scale
      });

      const p = {};
      Object.keys(points).forEach(key => {
        p[key] = toScreen(points[key]);
      });

      ctx.save();
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      if (this.options.showShadow) {
        drawShadow(ctx, drawX, numberOr(drawOptions.shadowGroundY, drawGroundY), scale, numberOr(drawOptions.shadowLift, 0));
      }

      if (drawOptions.showForceArrow && drawOptions.currentForce > drawOptions.weight) {
        drawForceArrow(ctx, drawX, drawGroundY, drawOptions.currentForce, drawOptions.weight, this.options.forceColor);
      }

      ctx.strokeStyle = color;
      ctx.lineWidth = stroke;
      drawLine(ctx, p.root, p.shoulderCenter);
      drawLine(ctx, p.leftShoulder, p.rightShoulder);
      drawLine(ctx, p.leftHip, p.rightHip);
      drawLine(ctx, p.leftShoulder, p.leftElbow);
      drawLine(ctx, p.leftElbow, p.leftHand);
      drawLine(ctx, p.rightShoulder, p.rightElbow);
      drawLine(ctx, p.rightElbow, p.rightHand);
      drawLine(ctx, p.leftHip, p.leftKnee);
      drawLine(ctx, p.leftKnee, p.leftAnkle);
      drawLine(ctx, p.leftAnkle, p.leftToe);
      drawLine(ctx, p.rightHip, p.rightKnee);
      drawLine(ctx, p.rightKnee, p.rightAnkle);
      drawLine(ctx, p.rightAnkle, p.rightToe);

      ctx.strokeStyle = this.options.lineColor;
      ctx.lineWidth = Math.max(2, stroke * 0.55);
      drawLine(ctx, p.neckTop, p.shoulderCenter);

      ctx.beginPath();
      ctx.arc(p.headCenter.x, p.headCenter.y, SIZES.headRadius * scale, 0, Math.PI * 2);
      ctx.fillStyle = "#f8fafc";
      ctx.fill();
      ctx.strokeStyle = this.options.lineColor;
      ctx.lineWidth = Math.max(2, stroke * 0.72);
      ctx.stroke();

      drawHand(ctx, p.leftHand, SIZES.hand * scale, this.options.lineColor);
      drawHand(ctx, p.rightHand, SIZES.hand * scale, this.options.lineColor);

      ctx.restore();
    }
  }

  function poseForState(state, pushProgress, depth) {
    if (state === "pushing") {
      const bendAmount = Math.sin(Math.PI * pushProgress) * depth;
      const extension = smoothStep(clamp((pushProgress - 0.58) / 0.42, 0, 1));
      const loaded = blendPose(REST_POSE, SQUAT_POSE, bendAmount);
      return blendPose(loaded, TAKEOFF_POSE, extension);
    }

    if (state === "flight") {
      return TAKEOFF_POSE;
    }

    if (state === "landed") {
      return LANDING_POSE;
    }

    return REST_POSE;
  }

  function depthForContactTime(contactTime) {
    return clamp(0.2 + ((contactTime - 0.12) / 0.53) * 0.9, 0.18, 1.08);
  }

  function bendDepthForState(state, profile, contactTime, options) {
    if (typeof state.squatDepth === "number" && Number.isFinite(state.squatDepth)) {
      return clamp(state.squatDepth, 0, 1.35);
    }

    const bendScale = numberOr(state.bendScale, profile.bendScale, options.bendScale, 1);
    return clamp(depthForContactTime(contactTime) * bendScale, 0, 1.35);
  }

  function calcPose(pose, sizes) {
    const root = { x: pose.rootX, y: pose.rootY };
    const torsoAngle = pose.torsoLean;
    const shoulderCenter = pointFromVerticalUp(root, sizes.torso, torsoAngle);
    const neckTop = pointFromVerticalUp(shoulderCenter, sizes.neck, torsoAngle);
    const headCenter = pointFromVerticalUp(neckTop, sizes.headRadius * 0.65, torsoAngle);
    const perp = perpendicularUnit(torsoAngle);

    const leftShoulder = offsetPoint(shoulderCenter, perp, -sizes.shoulderWidth / 2);
    const rightShoulder = offsetPoint(shoulderCenter, perp, sizes.shoulderWidth / 2);
    const leftHip = offsetPoint(root, perp, -sizes.hipWidth / 2);
    const rightHip = offsetPoint(root, perp, sizes.hipWidth / 2);

    const leftElbow = pointFromVerticalDown(leftShoulder, sizes.upperArm, pose.leftShoulder, -1);
    const rightElbow = pointFromVerticalDown(rightShoulder, sizes.upperArm, pose.rightShoulder, 1);
    const leftHand = pointFromVerticalDown(leftElbow, sizes.forearm, pose.leftShoulder + pose.leftElbow, -1);
    const rightHand = pointFromVerticalDown(rightElbow, sizes.forearm, pose.rightShoulder + pose.rightElbow, 1);

    const leftKnee = pointFromVerticalDown(leftHip, sizes.upperLeg, pose.leftHip, -1);
    const rightKnee = pointFromVerticalDown(rightHip, sizes.upperLeg, pose.rightHip, 1);
    const leftAnkle = pointFromVerticalDown(leftKnee, sizes.lowerLeg, pose.leftHip - pose.leftKnee, -1);
    const rightAnkle = pointFromVerticalDown(rightKnee, sizes.lowerLeg, pose.rightHip - pose.rightKnee, 1);
    const leftToe = pointFromVerticalDown(leftAnkle, sizes.foot, 90 + pose.leftAnkle, -1);
    const rightToe = pointFromVerticalDown(rightAnkle, sizes.foot, 90 + pose.rightAnkle, 1);

    return {
      root,
      shoulderCenter,
      neckTop,
      headCenter,
      leftShoulder,
      rightShoulder,
      leftElbow,
      rightElbow,
      leftHand,
      rightHand,
      leftHip,
      rightHip,
      leftKnee,
      rightKnee,
      leftAnkle,
      rightAnkle,
      leftToe,
      rightToe
    };
  }

  function blendPose(fromPose, toPose, amount) {
    const q = clamp(amount, 0, 1);
    const pose = {};
    POSE_KEYS.forEach(key => {
      pose[key] = fromPose[key] + (toPose[key] - fromPose[key]) * q;
    });
    return pose;
  }

  function getBounds(points) {
    const values = Object.values(points);
    return values.reduce((bounds, point) => ({
      minX: Math.min(bounds.minX, point.x),
      maxX: Math.max(bounds.maxX, point.x),
      minY: Math.min(bounds.minY, point.y),
      maxY: Math.max(bounds.maxY, point.y)
    }), { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity });
  }

  function drawLine(ctx, a, b) {
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  }

  function drawHand(ctx, point, radius, color) {
    ctx.beginPath();
    ctx.arc(point.x, point.y, Math.max(3, radius), 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  }

  function drawShadow(ctx, x, groundY, scale, liftMeters) {
    const liftFactor = clamp(1 - liftMeters * 0.28, 0.48, 1);
    ctx.save();
    ctx.fillStyle = "rgba(15, 23, 42, 0.16)";
    ctx.beginPath();
    ctx.ellipse(x, groundY + 7, 86 * scale * liftFactor, 14 * scale * liftFactor, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawForceArrow(ctx, x, groundY, currentForce, weight, color) {
    const ratio = clamp((currentForce - weight) / Math.max(weight, 1), 0, 3);
    const length = 24 + ratio * 26;
    const bottom = groundY + 30;
    const top = bottom - length;

    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(x, bottom);
    ctx.lineTo(x, top);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, top - 9);
    ctx.lineTo(x - 8, top + 5);
    ctx.lineTo(x + 8, top + 5);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function pointFromVerticalUp(origin, length, deg) {
    const r = degToRad(deg);
    return { x: origin.x + Math.sin(r) * length, y: origin.y - Math.cos(r) * length };
  }

  function pointFromVerticalDown(origin, length, deg, side) {
    const r = degToRad(deg);
    return { x: origin.x + side * Math.sin(r) * length, y: origin.y + Math.cos(r) * length };
  }

  function perpendicularUnit(deg) {
    const r = degToRad(deg);
    return { x: Math.cos(r), y: Math.sin(r) };
  }

  function offsetPoint(origin, unit, distance) {
    return { x: origin.x + unit.x * distance, y: origin.y + unit.y * distance };
  }

  function smoothStep(x) {
    const q = clamp(x, 0, 1);
    return q * q * (3 - 2 * q);
  }

  function degToRad(deg) {
    return deg * Math.PI / 180;
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function numberOr() {
    for (let i = 0; i < arguments.length; i += 1) {
      const value = arguments[i];
      if (typeof value === "number" && Number.isFinite(value)) return value;
    }
    return 0;
  }

  global.createStickmanJumpAnimator = createStickmanJumpAnimator;
  global.StickmanJumpAnimator = StickmanJumpAnimator;

  if (typeof module !== "undefined" && module.exports) {
    module.exports = { createStickmanJumpAnimator, StickmanJumpAnimator };
  }
})(typeof window !== "undefined" ? window : globalThis);
