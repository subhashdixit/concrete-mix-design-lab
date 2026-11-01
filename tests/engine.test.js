import test from "node:test";
import assert from "node:assert/strict";
import { trialMix } from "../site/engine.js";
const input = {
  water: 180,
  ratio: 0.5,
  scm: 0,
  cementSG: 3.15,
  scmSG: 2.4,
  fineSG: 2.65,
  coarseSG: 2.7,
  air: 2,
  fineFraction: 40,
  fineAbs: 1,
  fineMC: 3,
  coarseAbs: 0.5,
  coarseMC: 1,
  batch: 1,
};
test("absolute volume balance and binder relation", () => {
  const r = trialMix(input);
  assert.equal(r.perM3.binder, 360);
  assert.ok(Math.abs(r.volumeSum - 1) < 1e-12);
  assert.ok(Math.abs(r.volumes.cement - 360 / 3150) < 1e-12);
});
test("aggregate free water plus water added restores design water", () => {
  const r = trialMix(input).perM3;
  assert.ok(
    Math.abs(r.waterToAdd + r.fineFreeWater + r.coarseFreeWater - 180) < 1e-10,
  );
  assert.ok(r.fineWet > r.fineSSD);
});
test("SSD moisture equals absorption and requires no correction", () => {
  const r = trialMix({ ...input, fineMC: 1, coarseMC: 0.5 }).perM3;
  assert.equal(r.waterToAdd, 180);
  assert.ok(Math.abs(r.fineWet - r.fineSSD) < 1e-10);
});
test("dry aggregates require extra water and batch scaling is linear", () => {
  const a = trialMix({ ...input, fineMC: 0, coarseMC: 0 }),
    b = trialMix({ ...input, fineMC: 0, coarseMC: 0, batch: 0.25 });
  assert.ok(a.perM3.waterToAdd > 180);
  assert.equal(b.batch.cement, a.perM3.cement / 4);
});
test("SCM replacement preserves binder and invalid assumptions fail", () => {
  const r = trialMix({ ...input, scm: 30 });
  assert.equal(r.perM3.cement + r.perM3.scm, 360);
  for (const patch of [
    { ratio: 0 },
    { water: Infinity },
    { fineSG: 0 },
    { water: 500, ratio: 0.2, cementSG: 1 },
  ])
    assert.throws(() => trialMix({ ...input, ...patch }));
});
