import { Backdrop, Box, Button, CircularProgress, FormControl, IconButton, InputLabel, MenuItem, Select, Snackbar, TextField, Typography } from '@mui/material';
import axios from 'axios';
import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom';
import MuiAlert from "@mui/material/Alert";
import { IoMdArrowBack } from "react-icons/io";
import LoadingButton from '@mui/lab/LoadingButton';

// Alert notification of MUI
const Alert = React.forwardRef(function Alert(props, ref) {
    return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

const bashUrl = process.env.REACT_APP_BASH_URL;

function AddPlan() {

    const navigate = useNavigate()
    const { id } = useParams()

    // //console.log("id: ", id);

    const [circul, setCircul] = useState(false)


    const [open, setOpen] = useState(false);
    const [customVariant, setCustomVariant] = useState("success");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [loading, setLoading] = useState(true)



    const [plan, setPlan] = useState({
        title: "",
        type: "",
        price: "",
        duration: "",
        durationType: ""
    })

    const [valPlan, setValPlan] = useState({
        title: "",
        type: "",
        price: "",
        duration: "",
        durationType: ""
    })

    const getSinglePlan = async () => {
        return await axios.get(`${bashUrl}/plan/get-single-by-id/${id}`).then((response) => {
            setPlan(response.data.result)
            setLoading(false)
        }).catch((err) => {
            //console.log("error on getSinglePlan: ", err);
        })
    }

    const handleOnChange = evt => {
        setValPlan({
            title: "",
            type: "",
            price: "",
            duration: ""
        })
        setPlan({ ...plan, [evt.target.name]: evt.target.value })
    }

    const handleChangeSelect = evt => {
        setPlan({ ...plan, type: evt.target.value })
        setValPlan({
            title: "",
            type: "",
            price: "",
            duration: "",
            durationType: ""
        })
    }

    const handleChangeSelectDurationType = evt => {
        setPlan({ ...plan, durationType: evt.target.value })
        setValPlan({
            title: "",
            type: "",
            price: "",
            duration: "",
            durationType: ""
        })
    }

    useEffect(() => {
        if (id) {
            getSinglePlan()
        } else {
            setLoading(false)
        }
    }, [loading])


    const handleSubmit = async (evt) => {
        evt.preventDefault()

        if (!plan.title) {
            setValPlan({ title: 'Plan title is required!' })
        } else if (!plan.type) {
            setValPlan({ type: 'Plan type is required!' })
        } else if (!plan.price) {
            setValPlan({ price: "Plan price is required!" })
        } else if (plan.price == 0 || plan.price < 0) {
            setValPlan({ price: 'Price should be more than 0!' })
        } else if (!plan.duration) {
            setValPlan({ duration: 'Please add number of duration' })
        } else if (plan.duration <= 0) {
            setValPlan({ duration: 'Please enter valid duration' })
        } else if (!plan.durationType) {
            setValPlan({ durationType: 'Please select duration type!' })
        } else {
            setLoading(true)
            setCircul(true)
            if (id) {
                return await axios.put(`${bashUrl}/plan/update-plan/${id}`, plan).then((response) => {
                    setLoading(false)
                    setError("")
                    setSuccess(response.data.msg)
                    setCustomVariant("success")
                    setOpen(true)
                    setCircul(false)
                    navigate(-1)
                }).catch((error) => {
                    setLoading(false)
                    setError(error.response.data.msg)
                    setSuccess("")
                    setCustomVariant("error")
                    setOpen(true)
                    setCircul(false)
                })
            }
            return await axios.post(`${bashUrl}/plan/add-plan`, plan).then((response) => {
                setLoading(false)
                setError("")
                setSuccess(response.data.msg)
                setCustomVariant("success")
                setOpen(true)
                setCircul(false)
                navigate(-1)
            }).catch((error) => {
                setLoading(false)
                setError(error.response.data.msg)
                setSuccess("")
                setCustomVariant("error")
                setOpen(true)
                setCircul(false)
            })
        }

    }


    return (
        <Box>
            <Snackbar open={open} autoHideDuration={6000} onClose={() => setOpen(false)} anchorOrigin={{ vertical: "top", horizontal: "right" }} key={"top" + "right"}>
                <Alert onClose={() => setOpen(false)} severity={customVariant} sx={{ width: "100%" }}>{error ? error : success}</Alert>
            </Snackbar>

            {/* <CircularProgress /> */}
            <Backdrop sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }} open={loading}>
                <CircularProgress color="inherit" />
            </Backdrop>
            <Box sx={{ width: '100%' }}>
                <Box sx={{ display: 'flex' }}>
                    <IconButton onClick={() => navigate(-1)}><IoMdArrowBack /></IconButton><Typography variant='h6' component={'div'} sx={{ mt: 0.5 }}>{id ? "Update" : "Add"} Plan</Typography>
                </Box>
            </Box>

            <Box sx={{ width: '100%' }} component={'form'} onSubmit={handleSubmit} noValidate>
                {/* plan title */}
                <TextField value={plan.title} type="text" id="outlined-basic" label="Plan Title" variant="outlined" name="title" sx={{ my: 2 }} placeholder='Plan Title' onChange={handleOnChange} error={valPlan.title ? true : false} fullWidth required />
                <Typography variant='caption' component={'div'} color={'error'} sx={{ mt: -1 }}>{valPlan.title ? valPlan.title : ''}</Typography>


                <Box sx={{ width: '100%', display: 'flex' }}>

                    {/* plan type */}
                    <Box sx={{ width: '49%', marginRight: '1%' }}>
                        <FormControl fullWidth sx={{ my: 1, background: 'white' }} required>
                            <InputLabel id="demo-simple-select-label">Plan Type</InputLabel>
                            <Select labelId="demo-simple-select-label" id="demo-simple-select" value={plan.type} label="Plan Type" onChange={handleChangeSelect}>
                                <MenuItem value={'Gold'}>Gold</MenuItem>
                                <MenuItem value={'Silver'}>Silver</MenuItem>
                                <MenuItem value={'Diamond'}>Diamond</MenuItem>
                            </Select>
                        </FormControl>
                        <Typography variant='caption' component={'div'} color={'error'} sx={{ mt: -1 }}>{valPlan.type ? valPlan.type : ''}</Typography>
                    </Box>

                    <Box sx={{ width: '49%', marginLeft: '1%' }}>
                        {/* plan price */}
                        <TextField value={plan.price} type="number" id="outlined-basic" label="Plan Price" variant="outlined" name="price" sx={{ my: 1 }} placeholder='Plan Price' onChange={handleOnChange} error={valPlan.price ? true : false} fullWidth required />
                        <Typography variant='caption' component={'div'} color={'error'} sx={{ mt: -1 }}>{valPlan.price ? valPlan.price : ''}</Typography>
                    </Box>
                </Box>

                {/* plan description */}
                <Box sx={{ width: '100%', display: 'flex' }}>
                    <Box style={{ width: '49%' }}>
                        <TextField value={plan.duration} type="number" id="outlined-basic" label="Plan Duration" variant="outlined" name="duration" sx={{ my: 2 }} placeholder='Plan duration' onChange={handleOnChange} error={valPlan.duration ? true : false} fullWidth required />
                        <Typography variant='caption' component={'div'} color={'error'} sx={{ mt: -1 }}>{valPlan.duration ? valPlan.duration : ''}</Typography>
                    </Box>
                    <Box sx={{ my: 2, width: '49%', marginLeft: '2%' }}>
                        <FormControl fullWidth sx={{ background: 'white' }} required>
                            <InputLabel id="demo-simple-select-label">Duration Type</InputLabel>
                            <Select labelId="demo-simple-select-label" id="demo-simple-select" value={plan.durationType} label="Gender" onChange={handleChangeSelectDurationType}>
                                <MenuItem value={'Month'}>Month</MenuItem>
                                <MenuItem value={'Year'}>Year</MenuItem>
                            </Select>
                        </FormControl>
                        <Typography variant='caption' component={'div'} color={'error'} sx={{ mt: -1 }}>{valPlan.durationType ? valPlan.durationType : ''}</Typography>
                    </Box>
                </Box>


                {circul ? <LoadingButton loading variant="contained" fullWidth>Submit</LoadingButton> : <Button type='submit' variant='contained' color='success' fullWidth>Submit</Button>}
                {/* <Button type='submit' variant='contained' color='success' fullWidth>Submit</Button> */}
            </Box>


        </Box>
    )
}

export default AddPlan