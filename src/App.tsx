import { useEffect, useState } from 'react'
import Uppy from '@uppy/core'
import './App.css'
import DragDrop from '@uppy/drag-drop'
import Tus from '@uppy/tus'

interface ISlider {
  label: string,
  minVal: number,
  maxVal: number,
  value: number,
  showValue?: boolean,
  setValue: (val: number) => void,
}

const Slider = ({ label, minVal, maxVal, value, setValue, showValue = true }: ISlider) => {
  return (
    <div className="slider">
      <label className="slider-label">{label}</label>
      {showValue ?
        <>
          <input
            className='slider-input'
            type="range"
            min={minVal}
            max={maxVal}
            step={(maxVal - minVal) / 1000}
            value={value}
            onChange={({ target }) => {
              const val = Number(target.value);
              setValue(val);
            }}
          />
          <span className="slider-value">{value}</span>
        </>
        : <div className='slider-input-filler' />
      }
    </div>)
}

function App() {
  const [uppy, setUppy] = useState(new Uppy({ autoProceed: true, debug: true }));
  const [context, setContext] = useState<AudioContext>(new AudioContext());
  const [songBuffer, setSongBuffer] = useState<AudioBuffer | null>(null);
  const [playNode, setPlayNode] = useState<AudioBufferSourceNode | null>(null);
  const [eq, setEQ] = useState<BiquadFilterNode>(context.createBiquadFilter());
  const [gainNode, setGainNode] = useState<GainNode>(context.createGain());
  const [isLoaded, setIsLoaded] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [gainVal, setGainVal] = useState(0.5);
  const [freqVal, setFreqVal] = useState(1000);
  const [eqGainVal, setEqGainVan] = useState(20);
  const [qVal, setQVal] = useState(1);
  const [showFreq, setShowFreq] = useState(true);

  useEffect(() => {
    uppy.use(DragDrop, { target: ".for-DragDrop" });
    uppy.use(Tus, {
      endpoint: 'https://tusd.tusdemo.net/files/', // use your tus endpoint here
      retryDelays: [0, 1000, 3000, 5000],
    })
    uppy.on('complete', (result) => {
      const data = result.successful[0].data;
      load(data);
      console.log('file uploaded', data.size);
    });

    window.context = context;
  }, []);

  useEffect(() => {
    eq.type = 'peaking';
    eq.frequency.value = freqVal;
    eq.Q.value = qVal;
    eq.gain.value = eqGainVal;
    gainNode.gain.value = gainVal;
  }, [gainVal, freqVal, qVal, eqGainVal]);

  const load = async (data) => {
    const buffer = await context.decodeAudioData(await data.arrayBuffer());
    setSongBuffer(buffer);

    const newPlayNode = context.createBufferSource();
    setPlayNode(newPlayNode);
    newPlayNode.buffer = buffer;
    newPlayNode.connect(gainNode);
    newPlayNode.loop = true;
    newPlayNode.playbackRate.value = 0;
    newPlayNode.start();
    window.newPlayNode = newPlayNode;
    newPlayNode.connect(gainNode);
    gainNode.connect(eq);
    eq.connect(context.destination);

    setIsLoaded(true);
    console.log('loaded');
  };

  const play = async () => {
    setPlaying(true);
    context.resume();
    if (!isLoaded || !playNode) {
      console.log('no audio data');
      return;
    }
    playNode.playbackRate.value = 1;
    console.log('playing');
  }

  const pause = () => {
    setPlaying(false);
    if (playNode) {
      playNode.playbackRate.value = 0;
    }
  }

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
        <div className="upload-container">
          <div className="for-DragDrop uppy-DragDrop-container"></div>
        </div>
        <div className='buttons'>
          {playing
            ? <button onClick={pause}>Pause</button>
            : <button onClick={play} disabled={!isLoaded}>Play</button>
          }
          <button onClick={randomFreq} disabled={!isLoaded}>
            {showFreq ? "Random Freq" : "Show Freq"}
          </button>
        </div>
        <div className="sliders">
          <Slider
            minVal={0}
            maxVal={2}
            value={gainVal}
            setValue={setGainVal}
            label="vol" />
          <Slider label="freq"
            minVal={20}
            maxVal={5000}
            value={freqVal}
            setValue={setFreqVal}
            showValue={showFreq}
          />
          <Slider label="q"
            minVal={0.1}
            maxVal={10}
            value={qVal}
            setValue={setQVal}
          />
          <Slider label="eqGain"
            minVal={-30}
            maxVal={30}
            value={eqGainVal}
            setValue={setEqGainVan}
          />
        </div>
      </header>
    </div>
  )
}

export default App
