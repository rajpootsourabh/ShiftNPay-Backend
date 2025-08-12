import LoadingButton from '@mui/lab/LoadingButton';
import { Box, Button, Divider, IconButton, Modal, TextField, Typography } from '@mui/material';
import axios from 'axios';
import React, { useState } from 'react'
import { IoCloseSharp } from "react-icons/io5";

const basURL = process.env.REACT_APP_BASH_URL;
const style = {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: 600,
    bgcolor: "background.paper",
    boxShadow: 24,
    p: 4,
    borderRadius: 1,
};
function AddKeys({ open, setOpen, setError, setSuccess, setLoading, setCustomVariant, setSnackOpen }) {
    const options = { Authorization: `Bearer ${localStorage.getItem("shifnpay-token")}`, "Content-Type": "application/json" };

    const [circul, setCircul] = useState(false)


    const [key, setKey] = useState({
        name: "",
        credential: "",
        description: ""
    })

    const [valKey, setValKey] = useState({
        name: "",
        credential: "",
        description: ""
    })

    const handleOnChange = (evt) => {
        setValKey({
            name: "",
            credential: "",
            description: ""
        })
        setKey({ ...key, [evt.target.name]: evt.target.value })
    }

    const handleClose = () => {
        setOpen(false)
        setKey({
            name: "",
            credential: "",
            description: ""
        })
    }


    const handleClick = async () => {
        if (!key.name) {
            setValKey({ ...valKey, name: 'Key name is required!' })
        } else if (!key.credential) {
            setValKey({ credential: 'Api Key is required!' })
        } else {
            setLoading(true)
            setCircul(true)
            return await axios.post(`${basURL}/credentials/add`, key, { headers: options }).then((response) => {
                setError("")
                setSuccess(response.data.msg)
                setCustomVariant("success")
                setSnackOpen(true)
                setLoading(false)
                setCircul(false)
                handleClose()
            }).catch((error) => {
                setSuccess("")
                setError(error.response.data.msg)
                setCustomVariant("error")
                setSnackOpen(true)
                setLoading(false)
                setCircul(false)
            })
        }
    }

    return (
        <Modal keepMounted open={open} onClose={handleClose} aria-labelledby="keep-mounted-modal-title" aria-describedby="keep-mounted-modal-description">
            <Box sx={style}>
                <Box sx={{ display: "flex", mt: 2, alignItems: 'center' }}>
                    <Typography id="keep-mounted-modal-title" variant="h6" component="h2">Add Key</Typography>
                    <Box sx={{ flexGrow: 1 }} />
                    {/* <Button style={{ backgroundColor: "red", color: "white" }} variant="outlined" color="error" onClick={() => { setOpen(false) }}>Cancel</Button> */}
                    <IconButton sx={{ mb: 1 }} onClick={handleClose}><IoCloseSharp /></IconButton>
                </Box>
                <Divider />
                <Box sx={{ mb: 2 }}>
                    {/* key name */}
                    <TextField value={key.name} type="text" id="outlined-basic" label="Key Name" variant="outlined" name="name" sx={{ my: 2 }} placeholder='Key Name' onChange={handleOnChange} error={valKey.name ? true : false} fullWidth required />
                    <Typography variant='caption' component={'div'} color={'error'} sx={{ mt: -1 }}>{valKey.name ? valKey.name : ''}</Typography>

                    {/* key */}
                    <TextField value={key.credential} type="text" id="outlined-basic" label="Key" variant="outlined" name="credential" sx={{ my: 2 }} placeholder='Key' onChange={handleOnChange} error={valKey.credential ? true : false} fullWidth required />
                    <Typography variant='caption' component={'div'} color={'error'} sx={{ mt: -1 }}>{valKey.credential ? valKey.credential : ''}</Typography>

                    {/* description */}
                    <TextField value={key.description} type="text" id="outlined-basic" label="Description" variant="outlined" name="description" sx={{ my: 2 }} placeholder='Description' onChange={handleOnChange} error={valKey.description ? true : false} fullWidth />
                    <Typography variant='caption' component={'div'} color={'error'} sx={{ mt: -1 }}>{valKey.description ? valKey.description : ''}</Typography>
                </Box>


                {circul ? <LoadingButton loading variant="contained" fullWidth >Submit</LoadingButton> : <Button style={{ backgroundColor: "green", color: "white" }} variant="outlined" color="success" onClick={handleClick} fullWidth>Submit</Button>}
            </Box>
        </Modal>
    )
}

export default AddKeys