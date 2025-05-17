import { useDispatch, useSelector } from 'react-redux';
import { increment, decrement, reset } from '../store/reducer';

function Home() {

  const language = useSelector((state) => state.test.language);

  const dispatch = useDispatch();

  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <h1>Counter: {language}</h1>
      <button onClick={() => dispatch(increment())}>Increment</button>
      <button onClick={() => dispatch(decrement())} style={{ margin: '0 10px' }}>
        Decrement
      </button>
      <button onClick={() => dispatch(reset())}>Reset</button>
    </div>
  );
}

export default Home;


// https://console.firebase.google.com/project/plan-1312b/database/plan-1312b-default-rtdb/data