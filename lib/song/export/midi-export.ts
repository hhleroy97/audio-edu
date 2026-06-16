import { Midi } from "@tonejs/midi";
import type { SongDefType } from "@/lib/schemas/song";
import { flattenSongEvents } from "../timeline";

/** Export SongDef note events to Standard MIDI File bytes (#111). */
export function songToMidiBuffer(song: SongDefType): Uint8Array {
  const midi = new Midi();
  midi.header.setTempo(song.meta.bpm);
  midi.header.timeSignatures = [{ ticks: 0, timeSignature: [4, 4] }];

  const track = midi.addTrack();
  track.name = song.meta.title;
  track.channel = 0;

  const ppq = midi.header.ppq;
  const secondsPerBeat = 60 / song.meta.bpm;

  for (const event of flattenSongEvents(song)) {
    if (event.kind !== "note") continue;
    const midiNote = event.midi ?? song.meta.rootMidi ?? 42;
    const startSec = (event.absoluteBeat * secondsPerBeat) / 1;
    const durSec = (event.durationBeats * secondsPerBeat) / 1;
    track.addNote({
      midi: midiNote,
      time: startSec,
      duration: durSec,
      velocity: Math.round((event.velocity ?? 0.8) * 127),
    });
  }

  for (const hit of song.drums?.hits ?? []) {
    const startSec = (hit.beat * secondsPerBeat) / 1;
    const drumNote =
      hit.sampleId === "kick" ? 36 : hit.sampleId === "snare" ? 38 : 42;
    track.addNote({
      midi: drumNote,
      time: startSec,
      duration: 0.1,
      velocity: Math.round((hit.velocity ?? 0.8) * 127),
    });
  }

  void ppq;
  return midi.toArray();
}

export function songToMidiBlob(song: SongDefType): Blob {
  return new Blob([Uint8Array.from(songToMidiBuffer(song))], { type: "audio/midi" });
}
