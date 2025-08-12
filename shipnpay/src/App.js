import './App.css';
import SignIn from './pages/SignIn';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Dashboard from './pages/Dashboard';
import { jwtDecode } from "jwt-decode";
import { useDispatch } from 'react-redux';
import { setUser } from './redux/userSlice';


function App() {

  const navigate = useNavigate();
  const token = localStorage.getItem("shifnpay-token");
  const date = new Date();
  const [admin, setAdmin] = useState("");

  const dispatch = useDispatch();


  useEffect(() => {
    if (token) {
      const decodedToken = jwtDecode(token);
      if (decodedToken.exp * 1000 < date.getTime()) {
        localStorage.removeItem("shifnpay-token");
        navigate("/signin");
      } else {
        setAdmin(decodedToken);
        dispatch(setUser(decodedToken.result))
        navigate("/");
      }
    } else {
      navigate("/signin");
    }
  }, [token]);

  return (
    <>
      {token ? <Dashboard admin={admin.reuslt} /> : <SignIn />}
    </>);
}

export default App;
