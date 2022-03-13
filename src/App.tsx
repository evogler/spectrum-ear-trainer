import { useEffect, useState } from 'react'
import logo from './logo.svg'
import Uppy from '@uppy/core'

import './App.css'
import DragDrop from '@uppy/drag-drop'
import Tus from '@uppy/tus'

interface ISlider {
  node: AudioNode | null,
  label: string,
  minVal: number,
  maxVal: number,
  initialVal: number,
  value: number,
  showValue: boolean,
  setValue: (val: number) => void,
}

const Slider = ({ node, label, minVal, maxVal, value, setValue, showValue=true }: ISlider) => {
  useEffect(() => {
    if (node) {
      node.value = value;
    }
  }, [value]);
  return (
    <div>
      <label>{label}</label>
      <input
        type="range"
        style={{ width: '500px' }}
        min={minVal}
        max={maxVal}
        step={(maxVal - minVal) / 1000}
        value={value}
        onChange={({ target }) => {
          const val = Number(target.value);
          setValue(val);
        }}
      />
      {showValue && (<span>{value}</span>)}
    </div>)
}

function App() {
  const [audioData, setAudioData] = useState<File | Blob | null>(null);
  const [uppy, setUppy] = useState(new Uppy({ autoProceed: true, debug: true }));
  const [context, setContext] = useState<AudioContext>(new AudioContext());
  const [songBuffer, setSongBuffer] = useState<AudioBuffer | null>(null);
  const [eq, setEQ] = useState<BiquadFilterNode>(context.createBiquadFilter());
  const [gainNode, setGainNode] = useState<GainNode>(context.createGain());
  const [playing, setPlaying] = useState(false);
  const [gainVal, setGainVal] = useState(0.5);
  const [freqVal, setFreqVal] = useState(1000);
  const [showFreq, setShowFreq] = useState(true);

  useEffect(() => {
    uppy.use(DragDrop, { target: ".for-DragDrop" });
    uppy.use(Tus, {
      endpoint: 'https://tusd.tusdemo.net/files/', // use your tus endpoint here
      retryDelays: [0, 1000, 3000, 5000],
    })
    uppy.on('complete', (result) => {
      setAudioData(result.successful[0].data);
      console.log('file uploaded', audioData?.size);
    });
  }, []);

  useEffect(() => {
    window.eq = eq;
    eq.type = 'peaking';
    eq.frequency.value = 1000;
    eq.gain.value = 20;
    eq.Q.value = 1;

    window.gain = gainNode;
    gainNode.gain.value = gainVal;
  }, []);

  const play = async () => {
    // if (playing) {
    //   return;
    // }
    if (!audioData) {
      console.log('no audio data');
      return;
    }
    setPlaying(true);
    context.resume();
    setSongBuffer(await context.decodeAudioData(await audioData.arrayBuffer()));
    const mySource = context.createBufferSource();
    mySource.buffer = songBuffer;
    mySource.connect(gainNode);
    gainNode.connect(eq);
    eq.connect(context.destination);
    mySource.loop = true;
    mySource.start();
  };

  const randomFreq = () => {
    if (!showFreq) {
      setShowFreq(true);
      return;
    }
    setShowFreq(false);
    const freq = Math.round(Math.random() * (5000 - 20) + 20);
    setFreqVal(freq);
    eq.frequency.value = freq;
  };

  return (
    <div className="App">
      <header className="App-header">
        <div className="for-DragDrop"></div>
        <button onClick={play}>Play</button>
        <button onClick={randomFreq}>{showFreq ? "Random Freq" : "Show Freq"}</button>
        <Slider
          minVal={0}
          maxVal={2}
          value={gainVal}
          setValue={setGainVal}
          node={gainNode.gain}
          label="vol" />
        <Slider label="freq"
          minVal={20}
          maxVal={5000}
          initialVal={1000}
          value={freqVal}
          setValue={setFreqVal}
          showValue={showFreq}
          node={eq.frequency} />
      </header>
    </div>
  )
}

export default App
