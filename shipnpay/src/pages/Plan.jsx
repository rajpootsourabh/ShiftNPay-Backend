import { Backdrop, Box, Button, CircularProgress, IconButton, InputAdornment, Paper, Snackbar, Table, TableBody, TableCell, TableContainer, TableHead, TablePagination, TableRow, TextField, Typography } from '@mui/material';
import React, { useEffect, useState } from 'react'
import MuiAlert from "@mui/material/Alert";
import { CiSearch } from "react-icons/ci";
import axios from 'axios';
import { Link } from 'react-router-dom';
import { FaRegEdit } from "react-icons/fa";
import { MdDeleteForever } from "react-icons/md";
import DeleteModal from '../common/DeleteModal';


const baseUrl = process.env.REACT_APP_BASH_URL;

// Alert notification of MUI
const Alert = React.forwardRef(function Alert(props, ref) {
    return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});
function Plan() {

    const options = { Authorization: `Bearer ${localStorage.getItem("shifnpay-token")}`, "Content-Type": "application/json" };
    const [vendor, setVendor] = useState([])

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

    const [deleteOpen, setDeleteOpen] = useState(false)
    const [data, setData] = useState({
        type: 'plan',
        title: '',
        _id: ''
    })

    const getAllVendorList = async () => {
        return await axios.get(`${baseUrl}/plan/get-plan`, { headers: options }).then((response) => {
            setVendor(response.data.result)
            setFilterData(response.data.result)
            setLoading(false)
        }).catch((error) => {
            setLoading(false)
            //console.log("error: ", error);
        })
    }


    // this is fro seraching data of driver
    useEffect(() => {
        const searchData = vendor.filter((item) =>
            item.title.toLowerCase().includes(search.toLocaleLowerCase()) ? item : null
        );
        setFilterData(searchData);
    }, [search]);


    // This is for Designing
    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(+event.target.value);
        setPage(0);
    };

    // //console.log("vendor: ", vendor);
    useEffect(() => {
        getAllVendorList()
    }, [loading])


    return (
        <Box>
            <Snackbar open={open} autoHideDuration={6000} onClose={() => setOpen(false)} anchorOrigin={{ vertical: "top", horizontal: "right" }} key={"top" + "right"}>
                <Alert onClose={() => setOpen(false)} severity={customVariant} sx={{ width: "100%" }}>{error ? error : success}</Alert>
            </Snackbar>

            <Backdrop sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }} open={loading}>
                <CircularProgress color="inherit" />
            </Backdrop>

            {/* this is for deleting custom modal */}
            <DeleteModal setOpen={setDeleteOpen} open={deleteOpen} data={data} setData={setData} setSuccess={setSuccess} setError={setError} setCustomVariant={setCustomVariant} refresh={refresh} setRefresh={setRefresh} setSnakOpen={setOpen} setLoading={setLoading} />

            <Box sx={{ width: '100%', height: 70, p: 1, mb: 1, display: 'flex', alignItems: 'center' }} component={Paper}>
                <Box sx={{ width: "40%" }}>
                    <TextField fullWidth label="Search..." name="search" onChange={(evt) => setSearch(evt.target.value)} value={search} placeholder="Search plan by title" id="outlined-start-adornment"
                        InputProps={{ startAdornment: (<InputAdornment position="start"><CiSearch /></InputAdornment>), }}
                    />
                </Box>
                <Box sx={{ flexGrow: 1 }} />
                <Link to={'/plan/add'} ><Button variant='outlined' color='success' sx={{ height: 45 }}>Add Plan</Button></Link>
            </Box>
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow sx={{ bgcolor: "#108A00", color: 'white' }}>
                            <TableCell sx={{ color: 'white' }} >Plan Title</TableCell>
                            <TableCell sx={{ color: 'white' }} align="center">Plan Type</TableCell>
                            <TableCell sx={{ color: 'white' }} align="center">Plan Price</TableCell>
                            <TableCell sx={{ color: 'white' }} align="center"> Plan Type </TableCell>
                            <TableCell sx={{ color: 'white' }} align="center"> Action </TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filterdData && filterdData.length ? (
                            filterdData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((item, ind) => {
                                return (
                                    <TableRow key={ind} hover>
                                        <TableCell >{item?.title}</TableCell>
                                        <TableCell align="center">{item?.type}</TableCell>
                                        <TableCell align="center">$ {item?.price}</TableCell>
                                        <TableCell align="center">{item?.duration}/{item?.durationType}</TableCell>
                                        <TableCell align="center">
                                            <Link to={`/plan/edit/${item._id}`} ><IconButton sx={{ color: 'orange' }}><FaRegEdit /></IconButton></Link>
                                            <IconButton sx={{ color: 'red' }} onClick={() => { setDeleteOpen(true); setData({ title: item?.title, _id: item?._id, type: 'plan' }) }}><MdDeleteForever /></IconButton>
                                        </TableCell>
                                        {/* <TableCell align="center">{item.status ? <Button variant='outlined' color='success' onClick={() => handleAreaydApproved(item)}>Approved</Button> : <Button variant='outlined' color='error' onClick={() => handleApproveVendor(item._id)}>Pending</Button>}</TableCell> */}
                                    </TableRow>
                                );
                            })
                        ) : (
                            <TableRow>
                                <TableCell colSpan={6} align="center">
                                    <Typography>No plan data found!</Typography>
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

export default Plan