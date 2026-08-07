// data/scenarios/index.ts
import type { ScenarioFixture } from "@/types/classroom";

import gannonStorm2024 from "./gannon-storm-2024.json";
import halloweenStorms2003 from "./halloween-storms-2003.json";
import quebecBlackout1989 from "./quebec-blackout-1989.json";
import starlinkLaunch2022 from "./starlink-launch-2022.json";
import evaPlanningQuiet from "./eva-planning-quiet.json";
import polarFlightG2 from "./polar-flight-g2.json";
import hamRadioContest from "./ham-radio-contest.json";
import cubesatLaunchQuiet from "./cubesat-launch-quiet.json";
import xflareAlert from "./xflare-alert.json";

const SCENARIO_FIXTURES: ScenarioFixture[] = [
  gannonStorm2024,
  halloweenStorms2003,
  quebecBlackout1989,
  starlinkLaunch2022,
  evaPlanningQuiet,
  polarFlightG2,
  hamRadioContest,
  cubesatLaunchQuiet,
  xflareAlert,
] as ScenarioFixture[];

export function getScenarioById(id: string): ScenarioFixture | undefined {
  return SCENARIO_FIXTURES.find((s) => s.id === id);
}

export function getAllScenarios(): ScenarioFixture[] {
  return SCENARIO_FIXTURES;
}
