import * as React from "react";
import Button from "@mui/material/Button";
import CssBaseline from "@mui/material/CssBaseline";
import TextField from "@mui/material/TextField";
import { Link, useNavigate } from "react-router-dom";
import Grid from "@mui/material/Grid";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import axios from "axios";
import MuiAlert from "@mui/material/Alert";
import { CircularProgress, FormControl, IconButton, InputLabel, OutlinedInput, Paper, Snackbar } from "@mui/material";
import { IoEye } from "react-icons/io5";
import { IoEyeOff } from "react-icons/io5";
import * as EmailValidator from 'email-validator';
import LoadingButton from '@mui/lab/LoadingButton';

const defaultTheme = createTheme();


function Copyright(props) {
  return (
    <Typography variant="body2" color="text.secondary" align="center" {...props}>
      {'Copyright © '}
      <Link color="inherit" href="/">
        SK Techrise
      </Link>{' '}
      {new Date().getFullYear()}
      {'.'}
    </Typography>
  );
}

// Alert notification of MUI
const Alert = React.forwardRef(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

const bashUrl = process.env.REACT_APP_BASH_URL;
export default function SignIn() {
  const navigate = useNavigate();

  const [circul, setCircul] = React.useState(false)


  const [open, setOpen] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const [customVariant, setCustomVariant] = React.useState("success");
  const [error, setError] = React.useState("");
  const [emp, setEmp] = React.useState({
    email: "",
    password: "",
  });

  const [valErr, setValErr] = React.useState({
    email: "",
    password: "",
  });

  // handle close for UI component alert
  const handleClose = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }
    setOpen(false);
  };

  // input onchange event
  const handleOnChange = (evt) => {
    setEmp({
      ...emp,
      [evt.target.name]: evt.target.value,
    });

    setValErr({
      email: "",
      password: "",
    });
  };

  const handleClickShowPassword = () => setShowPassword((show) => !show);
  const handleMouseDownPassword = (event) => {
    event.preventDefault();
  };

  // handle submit for SigIn
  const handleSubmit = async (evt) => {
    evt.preventDefault();
    if (!emp.email) {
      setValErr({ email: "Email required!", });
    } else if (!EmailValidator.validate(emp.email)) {
      setValErr({ email: "Invalid email!", });
    } else if (!emp.password) {
      // console.log("password: ");
      setValErr({ password: "Password required!", });
    } else if (emp.password.length < 5) {
      setValErr({ password: "Password must be more than 5 words!", });
    } else {
      setCircul(true)
      return await axios.post(`${bashUrl}/admin/login-super-admin`, emp).then((response) => {
        const token = response.data.token;
        localStorage.setItem("shifnpay-token", token);
        setCircul(false)
        navigate("/");
      }).catch((err) => {
        setError(err?.response?.data?.msg);
        setCustomVariant("error");
        setOpen(true);
        setCircul(false)
        console.log("err: ", err);
      });
    }
  };

  // <IoMdEyeOff />
  return (
    <ThemeProvider theme={defaultTheme}>
      <Snackbar open={open} autoHideDuration={6000} onClose={handleClose} anchorOrigin={{ vertical: "top", horizontal: "right" }} key={"top" + "right"}>
        <Alert onClose={handleClose} severity={customVariant} sx={{ width: "100%" }}>{error ? error : ""}</Alert>
      </Snackbar>
      <Grid container component="main" sx={{ height: '100vh' }}>
        <CssBaseline />
        <Grid item xs={false} sm={4} md={7} sx={{ backgroundImage: 'url(https://shiftnpay.com/api/images/login/regisrationImage.png)', backgroundRepeat: 'no-repeat', backgroundColor: (t) => t.palette.mode === 'light' ? t.palette.grey[50] : t.palette.grey[900], backgroundSize: 'cover', backgroundPosition: 'center', }} />

        <Grid item xs={12} sm={8} md={5} component={Paper} elevation={6} square>
          <Box sx={{ my: 8, mx: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', }}>

            <Box sx={{ width: 200, height: 150 }}><img src='./logo/sky.png' alt='logo' style={{ width: '100%', height: '100%' }} /></Box>
            <Typography component="h1" variant="h5"> Sign in</Typography>

            <Box component="form" noValidate onSubmit={handleSubmit} sx={{ mt: 1 }}>

              {/* <TextField error={valErr.email ? true : false} helperText={valErr.email ? valErr.email : ""} required fullWidth id="email" onChange={handleOnChange} label="Email" name="email" type={"email"} sx={{ mb: 2 }} /> */}
              <TextField error={valErr.email ? true : false} helperText={valErr.email ? valErr.email : ""} required fullWidth id="email" onChange={handleOnChange} label="Email" name="email" type={"email"} sx={{ mb: 2 }} />

              <FormControl variant="outlined" fullWidth>
                <InputLabel htmlFor="outlined-adornment-password">Password</InputLabel>
                <OutlinedInput name="password" value={emp.password} onChange={handleOnChange} id="outlined-adornment-password" type={showPassword ? "text" : "password"} error={valErr.password ? true : false} endAdornment={
                  <IconButton aria-label="toggle password visibility" onClick={handleClickShowPassword} onMouseDown={handleMouseDownPassword} edge="end">
                    {showPassword ? <IoEyeOff /> : <IoEye />}
                  </IconButton>} label="Password" />
                <Typography variant="caption" color={'error'} >{valErr.password ? valErr.password : ''}</Typography>
              </FormControl>


              {/* <Box sx={{ m: 1, position: 'relative' }}> */}
              {circul ? <LoadingButton loading fullWidth variant="contained" sx={{ mt: 3, mb: 2, }}>Sign In</LoadingButton> : <Button type="submit" fullWidth variant="contained" sx={{ mt: 3, mb: 2, bgcolor: "#108A00", '&:hover': { bgcolor: "#0D6E00" } }}>Sign In</Button>}
              {/* </Box> */}



              <Copyright sx={{ mt: 5 }} />
            </Box>
          </Box>
        </Grid>
      </Grid>
    </ThemeProvider>
  );
}

/* 


    <ThemeProvider theme={theme}>
      <Snackbar open={open} autoHideDuration={6000} onClose={handleClose} anchorOrigin={{ vertical: "top", horizontal: "right" }} key={"top" + "right"}>
        <Alert onClose={handleClose} severity={customVariant} sx={{ width: "100%" }}>{error ? error : ""}</Alert>
      </Snackbar>

      <Grid container component="main" maxWidth="xs" sx={{ marginTop: 20 }}>
        <CssBaseline />
        <Grid item xs={false} sm={3} md={3} />

        <Grid item xs={12} sm={6} md={6} component={Paper} elevation={6} square>
          <Box component="form" noValidate>
            <Box sx={{ bgcolor: "rgba(231, 231, 231, 1)", height: 100, margin: 5, marginTop: -4, borderRadius: 2, }}>
              <Box sx={{ display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'space-evenly', }}>

                <Typography component="h1" variant="h5" sx={{ textAlign: "center", color: "#1F3255", }}>Super Admin Login</Typography>
                <img src="./logo/sky.png" alt="logo" style={{ width: '100px', height: '100px' }} />

                <Typography sx={{ textAlign: "center", color: "#1F3255" }}>Please Enter your Login Details..!!</Typography>
              </Box>


            </Box>
            <Box sx={{ marginTop: 0, display: "flex", flexDirection: "column", alignItems: "center", p: 2, marginBottom: 4, }}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField error={valErr.email ? true : false} helperText={valErr.email ? valErr.email : ""} required fullWidth id="email" onChange={handleOnChange} label="Email" name="email" type={"email"} />
                </Grid>

                <Grid item xs={12} sx={{ mt: 1 }}>
                  <FormControl variant="outlined" fullWidth>
                    <InputLabel htmlFor="outlined-adornment-password">Password</InputLabel>
                    <OutlinedInput name="password" value={emp.password} onChange={handleOnChange} id="outlined-adornment-password" type={showPassword ? "text" : "password"} error={valErr.password ? true : false} endAdornment={
                      <IconButton aria-label="toggle password visibility" onClick={handleClickShowPassword} onMouseDown={handleMouseDownPassword} edge="end">
                        {showPassword ? <IoEyeOff /> : <IoEye />}
                      </IconButton>
                      // </InputAdornment>
                    }
                      label="Password"
                    />
                    <Typography variant="caption" color={'error'} >{valErr.password ? valErr.password : ''}</Typography>
                  </FormControl>
                </Grid>
              </Grid>
            </Box>
            <Button type="submit" fullWidth onClick={handleSubmit} variant="contained" sx={{ position: "relative", margin: "auto", padding: 2, width: 300, display: "block", bgcolor: "#108A00", '&:hover': { bgcolor: "#0D6E00" }, mb: 2, }}>Sign In</Button>
          </Box>
        </Grid>
      </Grid>
    </ThemeProvider>
*/
