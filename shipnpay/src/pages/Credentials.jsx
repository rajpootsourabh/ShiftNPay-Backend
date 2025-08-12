import { Backdrop, Box, Button, CircularProgress, IconButton, InputAdornment, Paper, Snackbar, Table, TableBody, TableCell, TableContainer, TableHead, TablePagination, TableRow, TextField, Typography } from '@mui/material';
import React, { useEffect, useState } from 'react'
import { FaRegEdit } from "react-icons/fa";
import { MdDeleteForever, MdVisibility } from "react-icons/md";
import { AiFillEyeInvisible } from "react-icons/ai";
import DeleteModal from '../common/DeleteModal';
import MuiAlert from "@mui/material/Alert";
import { CiSearch } from "react-icons/ci";
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import AddKeys from '../components/AddKeys';
import moment from 'moment'

const baseUrl = process.env.REACT_APP_BASH_URL;

// Alert notification of MUI
const Alert = React.forwardRef(function Alert(props, ref) {
    return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});
function Credentials() {
    const options = { Authorization: `Bearer ${localStorage.getItem("shifnpay-token")}`, "Content-Type": "application/json" };
    const navigate = useNavigate()

    const [keys, setKeys] = useState([])

    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [filterdData, setFilterData] = useState([]);
    const [refresh, setRefresh] = useState(false);
    const [search, setSearch] = useState("");
    const [open, setOpen] = useState(false);
    const [customVariant, setCustomVariant] = useState("success");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState();
    const [loading, setLoading] = useState(true);

    const [loader, setLoader] = useState(false)

    const [decrypted, setDecrypted] = useState({
        id: '',
        key: ''
    })

    const [keyOpen, setKeyOpen] = useState(false)

    const [deleteOpen, setDeleteOpen] = useState(false)
    const [data, setData] = useState({
        type: 'key',
        title: '',
        _id: ''
    })

    const getAllKeysList = async () => {
        return await axios.get(`${baseUrl}/credentials/get-all`, { headers: options }).then((response) => {
            setKeys(response.data.result)
            setFilterData(response.data.result)
            setDecrypted({ id: null, key: response.data?.result[0]?.credential })
            // console.log("result: ", response.data.result);
            setLoading(false)
        }).catch((error) => {
            setSuccess("")
            setError(error.response.data.msg)
            setCustomVariant("error")
            setOpen(true)
            setLoading(false)
            console.log("error: ", error);
            if (error.response.status == 401) {
                localStorage.removeItem("shifnpay-token")
                navigate("/signin");
            }
        })
    }

    // this is fro seraching data of driver
    useEffect(() => {
        const searchData = keys.filter((item) =>
            item?.name.toLowerCase().includes(search.toLocaleLowerCase()) ? item : null
        );
        setFilterData(searchData);
    }, [search]);

    // const decryptedText = CryptoJS.AES.decrypt(encryptedText, secret).toString(CryptoJS.enc.Utf8);

    // This is for Designing
    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(+event.target.value);
        setPage(0);
    };

    // console.log("keys: ", decrypted);
    useEffect(() => {
        getAllKeysList()
    }, [loading])

    const decriptData = async (ind, keyData) => {
        if (decrypted.id == ind) {
            return setDecrypted("")
        }
        setLoader(true)
        return await axios.post(`${baseUrl}/credentials/decrypt-key`, { key: keyData }, { headers: options }).then((response) => {
            setLoader(false)
            setDecrypted({ id: ind, key: response.data.result })
        }).catch((error) => {
            setSuccess("")
            setError(error.response.data.msg)
            setCustomVariant("error")
            setOpen(true)
            if (error.response.status == 401 || error.response.status == 403) {
                localStorage.removeItem("shifnpay-token")
                navigate("/signin");
            }
        })
    }

    // console.log("decrypted: ", decrypted);

    return (
        <Box>
            <Snackbar open={open} autoHideDuration={6000} onClose={() => setOpen(false)} anchorOrigin={{ vertical: "top", horizontal: "right" }} key={"top" + "right"}>
                <Alert onClose={() => setOpen(false)} severity={customVariant} sx={{ width: "100%" }}>{error ? error : success}</Alert>
            </Snackbar>

            <Backdrop sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }} open={loading}>
                <CircularProgress color="inherit" />
            </Backdrop>

            {/* this is for adding key using modal */}
            <AddKeys open={keyOpen} setOpen={setKeyOpen} setLoading={setLoading} setSuccess={setSuccess} success={success} error={error} setError={setError} setCustomVariant={setCustomVariant} setSnackOpen={setOpen} />

            {/* this is for deleting custom modal */}
            <DeleteModal setOpen={setDeleteOpen} open={deleteOpen} data={data} setData={setData} setSuccess={setSuccess} setError={setError} setCustomVariant={setCustomVariant} refresh={refresh} setRefresh={setRefresh} setSnakOpen={setOpen} setLoading={setLoading} />

            <Box sx={{ width: '100%', height: 70, p: 1, mb: 1, display: 'flex', alignItems: 'center' }} component={Paper}>
                <Box sx={{ width: "40%" }}>
                    <TextField fullWidth label="Search..." name="search" onChange={(evt) => setSearch(evt.target.value)} value={search} placeholder="Search plan by title" id="outlined-start-adornment"
                        InputProps={{ startAdornment: (<InputAdornment position="start"><CiSearch /></InputAdornment>), }}
                    />
                </Box>
                <Box sx={{ flexGrow: 1 }} />
                <Button variant='outlined' color='success' sx={{ height: 45 }} onClick={() => setKeyOpen(true)}>Add Key</Button>
            </Box>
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow sx={{ bgcolor: "#108A00", color: 'white' }}>
                            <TableCell sx={{ color: 'white' }} >Name</TableCell>
                            <TableCell sx={{ color: 'white' }}>Key</TableCell>
                            <TableCell sx={{ color: 'white' }} align="center">Description</TableCell>
                            <TableCell sx={{ color: 'white' }} align="center">Date</TableCell>
                            <TableCell sx={{ color: 'white' }} align="center"> Action </TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filterdData && filterdData.length ? (
                            filterdData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((item, ind) => {
                                return (
                                    <TableRow key={ind} hover>
                                        <TableCell >{item?.name}</TableCell>
                                        <TableCell >{decrypted.id == ind ? decrypted.key : item.credential} <IconButton color='success' onClick={() => decriptData(ind, item.credential)}>{decrypted.id == ind ? <AiFillEyeInvisible /> : <MdVisibility />}{/* <MdVisibility /> */} </IconButton></TableCell>
                                        <TableCell align="center">{item?.description}</TableCell>
                                        <TableCell align="center">{moment(item?.createdAt).format("LLL")}</TableCell>
                                        <TableCell align="center">
                                            {/* <Link to={`/plan/edit/${item._id}`} ><IconButton sx={{ color: 'orange' }}><FaRegEdit /></IconButton></Link> */}
                                            <IconButton sx={{ color: 'red' }} onClick={() => { setDeleteOpen(true); setData({ title: item?.title, _id: item?._id, type: 'key' }) }}> <MdDeleteForever /></IconButton>
                                        </TableCell>
                                        {/* <TableCell align="center">{item.status ? <Button variant='outlined' color='success' onClick={() => handleAreaydApproved(item)}>Approved</Button> : <Button variant='outlined' color='error' onClick={() => handleApprovekeys(item._id)}>Pending</Button>}</TableCell> */}
                                    </TableRow>
                                );
                            })
                        ) : (
                            <TableRow>
                                <TableCell colSpan={6} align="center">
                                    <Typography>No keys data found!</Typography>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
                <TablePagination rowsPerPageOptions={[10, 25, 100]} component="div" count={filterdData.length} rowsPerPage={rowsPerPage} page={page} onPageChange={handleChangePage} onRowsPerPageChange={handleChangeRowsPerPage} />
            </TableContainer>
        </Box>
    )
}

export default Credentials