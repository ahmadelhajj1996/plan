import { Provider } from 'react-redux';
import Approutes from "./router";
import Authenticated from './Layouts/Authenticated';
import store from "./store/store";
import { useSelector } from 'react-redux';
import { ToastContainer, Flip } from 'react-toastify';

function App() {


  return (
    <>
      <Provider store={store}>
        <Authenticated />
        <ToastContainer stacked transition={Flip} />

      </Provider>
    </>
  );
}

export default App
