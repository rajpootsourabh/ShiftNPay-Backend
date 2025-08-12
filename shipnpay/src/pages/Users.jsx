import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { Backdrop, Box, Button, CircularProgress, InputAdornment, Paper, Snackbar, Table, TableBody, TableCell, TableContainer, TableHead, TablePagination, TableRow, TextField, Typography } from '@mui/material';
import MuiAlert from "@mui/material/Alert";
import { CiSearch } from "react-icons/ci";

// Alert notification of MUI
const Alert = React.forwardRef(function Alert(props, ref) {
    return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});
function Users() {
    const options = { Authorization: `Bearer ${localStorage.getItem("shifnpay-token")}`, "Content-Type": "application/json" };
    const baseUrl = process.env.REACT_APP_BASH_URL;
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

    const getAllVendorList = async () => {
        return await axios.get(`${baseUrl}/admin/get-all-vendor`).then((response) => {
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
            item.name.toLowerCase().includes(search.toLocaleLowerCase()) ? item : null
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

    const handleApproveVendor = async (id) => {
        setLoading(true)
        return await axios.put(`${baseUrl}/admin/vendor-approval/${id}`, { status: true }, { headers: options }).then((response) => {
            setError("")
            setLoading(false)
            setSuccess(response.data.msg)
            setCustomVariant("success")
            setOpen(true)
        }).catch((error) => {
            setLoading(false)
            setSuccess("")
            setError(error.response.data.msg)
            setCustomVariant("error")
            setOpen(true)
        })
    }

    const handleAreaydApproved = async (item) => {
        setSuccess("")
        setError(`Vendor ${item.name} aready approved`)
        setCustomVariant("error")
        setOpen(true)
    }

    return (
        <Box>
            <Snackbar open={open} autoHideDuration={6000} onClose={() => setOpen(false)} anchorOrigin={{ vertical: "top", horizontal: "right" }} key={"top" + "right"}>
                <Alert onClose={() => setOpen(false)} severity={customVariant} sx={{ width: "100%" }}>{error ? error : success}</Alert>
            </Snackbar>
            <Backdrop sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }} open={loading}>
                <CircularProgress color="inherit" />
            </Backdrop>

            <Box sx={{ width: '100%', height: 70, p: 1, mb: 1 }} component={Paper}>
                <Box sx={{ width: "40%" }}>
                    <TextField fullWidth label="Search..." name="search" onChange={(evt) => setSearch(evt.target.value)} value={search} placeholder="Search vender by name" id="outlined-start-adornment"
                        InputProps={{ startAdornment: (<InputAdornment position="start"><CiSearch /></InputAdornment>), }}
                    />
                </Box>
            </Box>
            <TableContainer component={Paper}>
                <Table /* aria-label='collapsible table' */>
                    <TableHead>
                        <TableRow sx={{ bgcolor: "#108A00", color: 'white' }}>
                            <TableCell sx={{ color: 'white' }} >Name</TableCell>
                            <TableCell sx={{ color: 'white' }} align="center">Email</TableCell>
                            <TableCell sx={{ color: 'white' }} align="center">Address</TableCell>
                            <TableCell sx={{ color: 'white' }} align="center"> Actions </TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filterdData && filterdData.length ? (
                            filterdData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((item, ind) => {
                                return (
                                    <TableRow key={ind} hover>
                                        <TableCell >{item.name}</TableCell>
                                        <TableCell align="center">{item.email}</TableCell>
                                        <TableCell align="center">{item.address}</TableCell>
                                        <TableCell align="center">{item.status ? <Button variant='outlined' color='success' onClick={() => handleAreaydApproved(item)}>Approved</Button> : <Button variant='outlined' color='error' onClick={() => handleApproveVendor(item._id)}>Pending</Button>}</TableCell>
                                    </TableRow>
                                );
                            })
                        ) : (
                            <TableRow>
                                <TableCell colSpan={6} align="center">
                                    <Typography>No Vendor data found!</Typography>
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

export default Users