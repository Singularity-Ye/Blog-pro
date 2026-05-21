import * as THREE from 'three';

const WORLD_UP = new THREE.Vector3(0, 1, 0);

export function normalToQuaternion(normal) {
  return new THREE.Quaternion().setFromUnitVectors(WORLD_UP, normal.clone().normalize());
}

export function getPointOnSphere(normal, radius) {
  return normal.clone().normalize().multiplyScalar(radius);
}

export function placeOnSphere(object, normal, radius) {
  object.position.copy(getPointOnSphere(normal, radius));
  object.quaternion.copy(normalToQuaternion(normal));
}

export function seededRandom(seed) {
  let state = seed >>> 0;

  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

export function normalFromLatLon(latDeg, lonDeg) {
  const lat = THREE.MathUtils.degToRad(latDeg);
  const lon = THREE.MathUtils.degToRad(lonDeg);

  return new THREE.Vector3(
    Math.cos(lat) * Math.sin(lon),
    Math.sin(lat),
    Math.cos(lat) * Math.cos(lon)
  ).normalize();
}

export function jitterNormal(center, amount, rand) {
  return center
    .clone()
    .add(new THREE.Vector3(
      (rand() - 0.5) * amount,
      (rand() - 0.5) * amount,
      (rand() - 0.5) * amount
    ))
    .normalize();
}
