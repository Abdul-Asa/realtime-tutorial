import { Howl, Howler } from "howler";
import { useState } from "react";

type Sound = {
  name: string;
  src: string;
};

export const useSound = () => {
  const [loadedSounds, setLoadedSounds] = useState<Record<string, Howl>>({});
  const [soundState, setSoundState] = useState<boolean>(false);
  const [globalVolume, setUniversalVolume] = useState<number>(1);

  const unload = () => {
    Howler.unload();
    setLoadedSounds({});
  };

  const load = async (sound: Sound) => {
    return new Promise<Howl>((resolve, reject) => {
      const howl = new Howl({
        src: [sound.src],
        volume: globalVolume, // Apply global volume to all loaded sounds
      });

      setLoadedSounds((prevSounds) => ({
        ...prevSounds,
        [sound.name]: howl,
      }));

      howl.once("load", () => resolve(howl));
      howl.once("loaderror", () => reject(howl));
    });
  };

  const loadAll = async (sounds: Sound[]) => {
    return Promise.all(sounds.map(async (sound) => await load(sound)));
  };

  const setGlobalVolume = (volume: number) => {
    setUniversalVolume(volume);
    // Adjust volume for all loaded sounds
    for (const key in loadedSounds) {
      if (loadedSounds.hasOwnProperty(key)) {
        const sound = loadedSounds[key];
        sound.volume(volume);
      }
    }
  };

  const setVolume = (nameOrUrl: string, volume: number) => {
    const sound = loadedSounds[nameOrUrl];
    if (sound) {
      sound.volume(volume);
    }
  };
  const playBackground = (nameOrUrl: string, noLoop = false) => {
    let sound = loadedSounds[nameOrUrl];
    if (sound) {
      sound.loop(!noLoop);
      sound.play();
    } else {
      sound = new Howl({ src: [nameOrUrl] });
      sound.loop(!noLoop);
      sound.play();
    }
  };

  const play = (nameOrUrl: string) => {
    let sound = loadedSounds[nameOrUrl];
    if (sound) {
      sound.play();
    } else {
      sound = new Howl({ src: [nameOrUrl] });
      sound.play();
    }
  };

  const pause = (nameOrUrl: string): void => {
    const sound = loadedSounds[nameOrUrl];
    if (sound) {
      sound.pause();
    }
  };

  const stopAll = () => {
    for (const key in loadedSounds) {
      if (loadedSounds.hasOwnProperty(key)) {
        const sound = loadedSounds[key];
        sound.stop();
      }
    }
  };

  const stop = (nameOrUrl: string) => {
    const sound = loadedSounds[nameOrUrl];
    if (sound) {
      sound.stop();
    }
  };

  const getSound = (nameOrUrl: string): Howl | undefined => {
    return loadedSounds[nameOrUrl];
  };
  return {
    loadedSounds,
    soundState,
    setSoundState,
    globalVolume,
    setGlobalVolume,
    setVolume,
    load,
    unload,
    playBackground,
    play,
    pause,
    getSound,
    stop,
    stopAll,
    loadAll,
    // ... other exported functions ...
  };
};
