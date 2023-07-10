export const DESCRIPTION = "TBD - Description to be defined";
export const UNREVEALED_IMAGE_URI =
  "https://drive.polychainmonsters.com/ipfs/QmUVahrtmwSMGGx3fPaAs5eR5gHDqmM7K3Qd8F3jEW8pDd";

export const ZK_MON_TYPE_APE = 0;
export const ZK_MON_TYPE_CHEETAH = 1;
export const ZK_MON_TYPE_DRAGON = 2;
export const ZK_MON_TYPE_GHOST = 3;
export const ZK_MON_TYPE_MAINE_COON = 4;
export const ZK_MON_TYPE_OWL = 5;
export const ZK_MON_TYPE_PANGOLIN = 6;
export const ZK_MON_TYPE_POMERANIAN = 7;
export const ZK_MON_TYPE_SQUIRREL = 8;

export type MonsterType =
  | typeof ZK_MON_TYPE_APE
  | typeof ZK_MON_TYPE_CHEETAH
  | typeof ZK_MON_TYPE_DRAGON
  | typeof ZK_MON_TYPE_GHOST
  | typeof ZK_MON_TYPE_MAINE_COON
  | typeof ZK_MON_TYPE_OWL
  | typeof ZK_MON_TYPE_PANGOLIN
  | typeof ZK_MON_TYPE_POMERANIAN
  | typeof ZK_MON_TYPE_SQUIRREL;

export const TYPE_TO_SUPPLY_MAPPING: { [K in MonsterType]: number } = {
  [ZK_MON_TYPE_APE]: 125,
  [ZK_MON_TYPE_CHEETAH]: 125,
  [ZK_MON_TYPE_DRAGON]: 125,
  [ZK_MON_TYPE_GHOST]: 100,
  [ZK_MON_TYPE_MAINE_COON]: 100,
  [ZK_MON_TYPE_OWL]: 100,
  [ZK_MON_TYPE_PANGOLIN]: 100,
  [ZK_MON_TYPE_POMERANIAN]: 100,
  [ZK_MON_TYPE_SQUIRREL]: 125,
};

export const getMonsterType = (creature: string): MonsterType => {
  switch (creature) {
    case "Ape":
      return ZK_MON_TYPE_APE;
    case "Cheetah":
      return ZK_MON_TYPE_CHEETAH;
    case "Dragon":
      return ZK_MON_TYPE_DRAGON;
    case "Ghost":
      return ZK_MON_TYPE_GHOST;
    case "Maine Coon":
      return ZK_MON_TYPE_MAINE_COON;
    case "Owl":
      return ZK_MON_TYPE_OWL;
    case "Pangolin":
      return ZK_MON_TYPE_PANGOLIN;
    case "Pomeranian":
      return ZK_MON_TYPE_POMERANIAN;
    case "Squirrel":
      return ZK_MON_TYPE_SQUIRREL;
    default:
      throw new Error(`Unexpected name ${creature}`);
  }
};

export const ZK_MON_BASE_URI_APE =
  "https://drive.polychainmonsters.com/ipfs/Qme2p1W82R61e2dR1xQjLW8j8v1VYXfcmyHMLBNSHTqZ9D/";
export const ZK_MON_BASE_URI_CHEETAH =
  "https://drive.polychainmonsters.com/ipfs/QmQH2TEo8mAd8k7ShX89SSFwe8XQ4PKyDbt2UVg3xk8Rqx/";
export const ZK_MON_BASE_URI_DRAGON =
  "https://drive.polychainmonsters.com/ipfs/QmPHRhLJPRrWsAzDKwbvgDrDZpK3qjAGV2nSPtWiuNbf9U/";
export const ZK_MON_BASE_URI_GHOST =
  "https://drive4.polychainmonsters.com/ipfs/QmcS3QwvfpmLtKvB7HjRqdfsNMfwKByZ9umDpZ2Fpp2tfR/";
export const ZK_MON_BASE_URI_MAINE_COON =
  "https://drive4.polychainmonsters.com/ipfs/QmWRriz29k1T5HixKcRuLxd3rq5agToU8SUH9dzuEGxAes/";
export const ZK_MON_BASE_URI_OWL =
  "https://drive4.polychainmonsters.com/ipfs/QmPaqTKzYPpGuuKJ4XpmrY8WZouaGq9FFq9PfLTd5i3fEg/";
export const ZK_MON_BASE_URI_PANGOLIN =
  "https://drive4.polychainmonsters.com/ipfs/QmQqViVuAQksVdnW5Raaj3Bz5zE5ttwKWSDyhuw7rz6tYW/";
export const ZK_MON_BASE_URI_POMERANIAN =
  "https://drive4.polychainmonsters.com/ipfs/QmbpNE2AAPPF8A9Hs9bqBiigghi68NkjXzK2EGb1BjUL9F/";
export const ZK_MON_BASE_URI_SQUIRREL =
  "https://drive4.polychainmonsters.com/ipfs/QmWWDW2XjmGV3JAwUoJvqjygDRgd5MeorpY7NMy8oF1FQF/";
