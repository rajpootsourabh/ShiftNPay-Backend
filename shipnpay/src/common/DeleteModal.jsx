import LoadingButton from '@mui/lab/LoadingButton';
import { Box, Button, Divider, Modal, Typography, setRef } from '@mui/material'
import axios from 'axios';
import React, { useState } from 'react'

const style = {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: 400,
    bgcolor: "background.paper",
    boxShadow: 24,
    p: 4,
};

const basURL = process.env.REACT_APP_BASH_URL;

function DeleteModal({ open, setOpen, setData, data, setSuccess, setError, setCustomVariant, refresh, setRefresh, setSnakOpen, setLoading }) {
    const options = { Authorization: `Bearer ${localStorage.getItem("gapshap-token")}`, "Content-Type": "application/json", role: "admin", };

    const [circul, setCircul] = useState(false)

    const handleClick = async (evt) => {
        evt.preventDefault();
        if (data.type == 'plan') {
            setCircul(true)
            return await axios.delete(`${basURL}/plan/delete-by-id/${data._id}`, { headers: options }).then((response) => {
                setOpen(false)
                setError("")
                setSuccess(response.data.msg)
                setCustomVariant("success")
                setSnakOpen(true)
                setLoading(true)
                setCircul(false)
            }).catch((error) => {
                setSuccess("")
                setError(error.response.data.msg)
                setCustomVariant("error")
                setSnakOpen(true)
                setOpen(false)
                setCircul(false)
            })
        } else if (data.type == 'key') {
            setCircul(true)
            return await axios.delete(`${basURL}/credentials/delete-api-key/${data._id}`, { headers: options }).then((response) => {
                setOpen(false)
                setError("")
                setSuccess(response.data.msg)
                setCustomVariant("success")
                setSnakOpen(true)
                setLoading(true)
                setCircul(false)
            }).catch((error) => {
                setSuccess("")
                setError(error.response.data.msg)
                setCustomVariant("error")
                setSnakOpen(true)
                setOpen(false)
                setCircul(false)
            })
        } else {
            console.log("on development process");
        }
    }

    return (
        <Modal keepMounted open={open} onClose={() => { setOpen(false); setData(""); }} aria-labelledby="keep-mounted-modal-title" aria-describedby="keep-mounted-modal-description">
            <Box sx={style}>
                <Typography id="keep-mounted-modal-title" variant="h6" component="h2" color="error">Are you sure you want to {data?.title}</Typography>
                <Divider />
                <Box sx={{ display: "flex", mt: 2 }}>
                    {/* <Button style={{ backgroundColor: "green", color: "white" }} variant="outlined" color="success" onClick={handleClick}>Yes</Button> */}
                    {circul ? <LoadingButton loading variant="contained">Yes</LoadingButton> : <Button style={{ backgroundColor: "green", color: "white" }} variant="outlined" color="success" onClick={handleClick}>Yes</Button>}
                    <Box sx={{ flexGrow: 1 }} />
                    <Button style={{ backgroundColor: "red", color: "white" }} variant="outlined" color="error" onClick={() => { setOpen(false); setData(""); }}>Cancel</Button>

                </Box>
            </Box>
        </Modal>
    )
}

export default DeleteModal