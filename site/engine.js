export const LIMITS = {
  water: [0.1, 500],
  ratio: [0.2, 0.9],
  scm: [0, 70],
  cementSG: [1, 4],
  scmSG: [1, 4],
  fineSG: [1, 4],
  coarseSG: [1, 4],
  air: [0, 12],
  fineFraction: [10, 70],
  fineAbs: [0, 15],
  fineMC: [0, 30],
  coarseAbs: [0, 15],
  coarseMC: [0, 30],
  batch: [0.001, 100],
};
export function trialMix(input) {
  for (const [k, [lo, hi]] of Object.entries(LIMITS))
    if (
      typeof input[k] !== "number" ||
      !Number.isFinite(input[k]) ||
      input[k] < lo ||
      input[k] > hi
    )
      throw Error(`Invalid ${k}: use ${lo}–${hi}.`);
  const binder = input.water / input.ratio,
    scm = (binder * input.scm) / 100,
    cement = binder - scm;
  const volumes = {
    water: input.water / 1000,
    cement: cement / (input.cementSG * 1000),
    scm: scm / (input.scmSG * 1000),
    air: input.air / 100,
  };
  const aggVolume = 1 - Object.values(volumes).reduce((s, v) => s + v, 0);
  if (aggVolume <= 0)
    throw Error("Water, binder and air leave no positive aggregate volume.");
  volumes.fine = (aggVolume * input.fineFraction) / 100;
  volumes.coarse = aggVolume - volumes.fine;
  const fineSSD = volumes.fine * input.fineSG * 1000,
    coarseSSD = volumes.coarse * input.coarseSG * 1000;
  const moisture = (ssd, abs, mc) => {
    const dry = ssd / (1 + abs / 100);
    return {
      dry,
      wet: dry * (1 + mc / 100),
      freeWater: (dry * (mc - abs)) / 100,
    };
  };
  const fine = moisture(fineSSD, input.fineAbs, input.fineMC),
    coarse = moisture(coarseSSD, input.coarseAbs, input.coarseMC);
  const addedWater = input.water - fine.freeWater - coarse.freeWater;
  if (addedWater < 0)
    throw Error(
      "Aggregate free moisture exceeds design free water. Reduce moisture or revise the trial assumptions.",
    );
  const perM3 = {
    cement,
    scm,
    binder,
    designFreeWater: input.water,
    waterToAdd: addedWater,
    fineSSD,
    coarseSSD,
    fineWet: fine.wet,
    coarseWet: coarse.wet,
    fineFreeWater: fine.freeWater,
    coarseFreeWater: coarse.freeWater,
  };
  const batch = Object.fromEntries(
    Object.entries(perM3).map(([k, v]) => [k, v * input.batch]),
  );
  return {
    assumptions: { ...input },
    volumes,
    perM3,
    batch,
    volumeSum: Object.values(volumes).reduce((s, v) => s + v, 0),
  };
}
