import { useEffect, useState } from 'react';
import Form from './components/form';
import BmiScore from './components/bmiscore';
import BmiList from './components/bmilist';
import './App.css';

function App() {
  const [bmi, setBmi] = useState("00");
  const [show, setShow] = useState(false);
  const [changeWeight, setChangeWeight] = useState({ weight: '', type: '' });
  const [bmiType, setBmiType] = useState('Not Calculated');
  const [bmiRange, setBmiRange] = useState({
    underWeight: { low: '', high: '' },
    normal: { low: '', high: '' },
    overWeight: { low: '', high: '' },
    obesityOne: { low: '', high: '' },
    obesityTwo: { low: '', high: '' },
    obesityThree: { low: '', high: '' }
  });

  const [ws, setWs] = useState(null);
  useEffect(() => {
    const socket = new WebSocket('ws://localhost:8080');
    setWs(socket);

    socket.onopen = () => {
      console.log('Connected to WebSocket server');
    };

    socket.onmessage = (event) => {
      console.log(`Received from server: ${event.data}`);
    };

    socket.onclose = () => {
      console.log('Disconnected from WebSocket server');
    };

    return () => {
      socket.close();
    };
  }, []);

  const onFormSub = (w, h) => {
    setShow(true);

    let heightInMeters = h / 100; // Convert height from cm to meters

    let calculatedBmi = calBmi(w, heightInMeters);
    setBmi(calculatedBmi);
    setBmiType(weightType(calculatedBmi));

    const range = {
      underWeight: { low: calWeight(18.5, heightInMeters) },
      normal: { low: calWeight(18.5, heightInMeters), high: calWeight(24.9, heightInMeters) },
      overWeight: { low: calWeight(25, heightInMeters), high: calWeight(29.9, heightInMeters) },
      obesityOne: { low: calWeight(30, heightInMeters), high: calWeight(34.9, heightInMeters) },
      obesityTwo: { low: calWeight(35, heightInMeters), high: calWeight(39.9, heightInMeters) },
      obesityThree: { low: calWeight(40, heightInMeters) }
    };

    setBmiRange(range);
    setChangeWeight(weighttToChange(calculatedBmi, w, range));

    // Ensure WebSocket is ready before sending data
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(`Weight: ${w}, Height: ${h}, BMI: ${calculatedBmi}`);
    } else {
      console.log('WebSocket is not ready');
    }
  };

  const weighttToChange = (bmi, w, range) => {
    let changeObj;
    if (bmi < 18.5) {
      changeObj = {
        weight: (range.normal.low - w).toFixed(2),
        type: 'negative'
      };
    } else if (bmi > 24.9) {
      changeObj = {
        weight: (w - range.normal.high).toFixed(2),
        type: 'positive'
      };
    } else {
      changeObj = {
        weight: 0,
        type: 'normal'
      };
    }
    return changeObj;
  };

  const calBmi = (w, h) => {
    return (w / (h * h)).toFixed(2);
  };

  const calWeight = (bmi, height) => {
    return (bmi * height * height).toFixed(2);
  };

  const weightType = (bmi) => {
    if (bmi < 18.5) {
      return 'Underweight';
    } else if (bmi >= 18.5 && bmi <= 24.9) {
      return 'Normal';
    } else if (bmi >= 25 && bmi <= 29.9) {
      return 'Overweight';
    } else if (bmi >= 30 && bmi <= 34.9) {
      return 'Obesity Class I';
    } else if (bmi >= 35 && bmi <= 39.9) {
      return 'Obesity Class II';
    } else if (bmi >= 40) {
      return 'Obesity Class III';
    }
  };

  return (
    <>
      <Form getData={onFormSub} />
      {show && (
        <div className='row mt-3'>
          <div className='col-md-6 p-5'>
            <BmiScore bmiNo={bmi} bmiName={bmiType} changeWeight={changeWeight} />
          </div>
          <div className='col-md-6 p-4'>
            <BmiList range={bmiRange} bmi={bmi} />
          </div>
        </div>
      )}
    </>
  );
}

export default App;
