import { describe, expect, it } from "vitest";
import {
  applyMixDefaultsToLayer,
  inferMixProfile,
  MIX_STRIP_DEFAULTS,
  stripConfigForProfile,
} from "@/lib/song/multibus/mix-profiles";
import { applySongGainToFlow } from "@/lib/song/multibus/layer-engine";
import { dbToLinear, DEFAULT_MASTER_CHAIN } from "@/lib/song/multibus/master-chain";
import { validateSong } from "@/lib/song/validate-song";
import { riddimSickDrop16 } from "@/lib/song/riddim/arrangement-builder";

describe("mix profiles", () => {
  it("infers sub/body/top from layer ids", () => {
    expect(inferMixProfile("sub")).toBe("sub");
    expect(inferMixProfile("body")).toBe("body");
    expect(inferMixProfile("top")).toBe("top");
    expect(inferMixProfile("lead")).toBe("body");
  });

  it("applies frequency split defaults per role", () => {
    const sub = stripConfigForProfile("sub");
    expect(sub.lpfHz).toBe(120);
    expect(sub.mono).toBe(true);

    const body = stripConfigForProfile("body");
    expect(body.hpfHz).toBe(90);
    expect(body.lpfHz).toBe(800);

    const top = stripConfigForProfile("top");
    expect(top.hpfHz).toBe(2000);
  });

  it("fills mixProfile and songGain on layer defs", () => {
    const layer = applyMixDefaultsToLayer({
      id: "body",
      presetId: "hydraulic-press-wobble",
      busGain: 0.75,
    });
    expect(layer.mixProfile).toBe("body");
    expect(layer.songGain).toBe(MIX_STRIP_DEFAULTS.body.songGain);
    expect(layer.busGain).toBe(0.75);
  });
});

describe("song gain scaling", () => {
  it("reduces output and distortion on flow nodes", () => {
    const nodes = applySongGainToFlow(
      [
        {
          id: "out-1",
          type: "output",
          position: { x: 0, y: 0 },
          data: {
            kind: "output",
            label: "out",
            params: { gain: 0.8 },
          },
        },
        {
          id: "dist-1",
          type: "distortion",
          position: { x: 0, y: 0 },
          data: {
            kind: "distortion",
            label: "dist",
            params: { drive: 8, type: "hard", mix: 1, gain: 0.6 },
          },
        },
      ],
      0.5
    );
    expect(nodes[0]!.data.params.gain).toBeCloseTo(0.4);
    expect(nodes[1]!.data.params.drive).toBeLessThan(8);
  });
});

describe("master chain defaults", () => {
  it("targets headroom and limiting", () => {
    expect(DEFAULT_MASTER_CHAIN.glueThreshold).toBeLessThan(0);
    expect(DEFAULT_MASTER_CHAIN.limiterThreshold).toBeLessThanOrEqual(-1);
    expect(dbToLinear(-0.5)).toBeLessThan(1);
  });
});

describe("mix-aware songs validate", () => {
  it("riddim-sick-drop-16 passes lint with mix profiles on layers", () => {
    const { song } = validateSong(riddimSickDrop16);
    expect(song.layers.some((l) => l.mixProfile === "sub")).toBe(true);
    expect(song.layers.some((l) => l.mixProfile === "body")).toBe(true);
  });
});
