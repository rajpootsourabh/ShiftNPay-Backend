import { Backdrop, Box, CircularProgress, Grid } from '@mui/material'
import React, { useEffect, useState } from 'react'
import DashboardCard from '../common/DashboardCard'
import axios from 'axios'
import { useSelector } from 'react-redux';
import { PiUserPlus } from "react-icons/pi";
import { PiUser } from "react-icons/pi";
import { PiUserMinus } from "react-icons/pi";
import { IoBriefcaseOutline } from "react-icons/io5";
import { IoKeyOutline } from "react-icons/io5";


const baseUrl = process.env.REACT_APP_BASH_URL;

function Home() {
    const user = useSelector((state) => state.user.user);
    const options = { Authorization: `Bearer ${localStorage.getItem("shifnpay-token")}`, "Content-Type": "application/json" };

    // //console.log("options: ", options);
    const [loading, setLoading] = useState(true)

    // const [empCount, setEmpCount] = useState(0)
    // const [jobCount, setJobCount] = useState(0)
    const [venderCount, setVenderCount] = useState(0)
    // const [planCount, setPlanCount] = useState(0)
    const [apiCount, setApiCount] = useState(0)
    const [inActiveVender, setInActiveVeder] = useState(0)
    const [activeVender, setActiveVender] = useState(0)

    // //console.log("user: ", user);
    const getDataCount = async () => {
        return await axios.get(`${baseUrl}/admin/get-count/${user?._id}`, { headers: options }).then((response) => {
            // setEmpCount(response.data.result.empCount)
            // setJobCount(response.data.result.jobCount)
            setVenderCount(response.data.result.vendorCount)
            // setPlanCount(response.data.result.planCount)
            setApiCount(response.data.result.apiCount)
            setInActiveVeder(response.data.result.vendorInActiveCount)
            setActiveVender(response.data.result.vendorActiveCount)
            setLoading(false)
        }).catch((error) => {
            // //console.log("error on getDataCount: ", error);
            setLoading(false)
        })
    }

    useEffect(() => {
        getDataCount()
    }, [loading])

    return (
        <Box>
            <Backdrop sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }} open={loading}>
                <CircularProgress color="inherit" />
            </Backdrop>
            <Grid spacing={2} container>
                <Grid item xs={6}>
                    <DashboardCard title={'Total Vendor'} icon={<PiUser size={45} color='white' />} count={venderCount ? venderCount : 0} />
                </Grid>

                <Grid item xs={6}>
                    <DashboardCard title={'Active Vendor'} icon={<PiUserPlus size={45} color='white' />} count={activeVender ? activeVender : 0} />
                </Grid>

                {/* <Grid item xs={6}>
                    <DashboardCard title={'Total Jobs'} icon={<IoBriefcaseOutline size={45} color='white' />} count={planCount ? planCount : 0} />
                </Grid> */}


                <Grid item xs={6}>
                    <DashboardCard title={'Total Api Keys'} icon={<IoKeyOutline size={45} color='white' />} count={apiCount ? apiCount : 0} />
                </Grid>
                <Grid item xs={6}>
                    <DashboardCard title={'In Active Vendor'} icon={<PiUserMinus size={45} color='white' />} count={inActiveVender ? inActiveVender : 0} />
                </Grid>

            </Grid>
        </Box>
    )
}

export default Home