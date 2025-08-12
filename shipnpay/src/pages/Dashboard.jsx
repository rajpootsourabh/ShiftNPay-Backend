import React, { useState } from 'react'
import Box from '@mui/material/Box';
import CssBaseline from '@mui/material/CssBaseline';
import Drawer from '@mui/material/Drawer';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import { AppBar, IconButton, ListItemIcon, ListItemText, Toolbar, Tooltip, Typography, colors } from '@mui/material';
import { Link, Route, Routes, useNavigate } from 'react-router-dom';
import Home from './Home';
import { MdDashboard } from "react-icons/md";
import { FaCcMastercard } from "react-icons/fa6";
import { FaUsers } from "react-icons/fa6";
import Users from './Users';
import { FiLogOut } from "react-icons/fi";
import Plan from './Plan';
import { RiMoneyDollarCircleFill } from "react-icons/ri";
import { FaMoneyBillWave } from "react-icons/fa";
import AddPlan from '../components/AddPlan';
import Credentials from './Credentials';
import { IoKey } from "react-icons/io5";

const drawerWidth = 200;

function Dashboard({ admin }) {
    const navigate = useNavigate();
    const [menu, setMenu] = useState({
        name: "Dashboard",
        active: 0
    })
    const menuAtive = "#108A00"
    const textActive = colors.grey[100]

    const menuInActive = colors.grey[200]
    const textInActive = colors.grey[500]

    const logout = (e) => {
        localStorage.removeItem("shifnpay-token")
        navigate("/signin");
    }


    return (
        <Box sx={{ display: 'flex' }}>
            <CssBaseline />
            <AppBar position="fixed" sx={{ width: `calc(100% - ${drawerWidth}px)`, ml: `${drawerWidth}px`, height: 70, background: '#108A00' }}>
                <Toolbar>
                    <Typography variant="h6" noWrap component="div">{menu.name}</Typography>
                    <Box sx={{ flexGrow: 1 }} />
                    <Tooltip title={"Logout"}>
                        <IconButton onClick={logout} sx={{ color: 'white' }}><FiLogOut /></IconButton>
                    </Tooltip>
                </Toolbar>
            </AppBar>

            <Drawer sx={{ width: drawerWidth, flexShrink: 0, '& .MuiDrawer-paper': { width: drawerWidth, boxSizing: 'border-box', }, borderColor: '#F5F5F5' }} variant="permanent" anchor="left">
                {/* app icon */}
                {/* <ListItem disablePadding sx={{ background: "white", mb: 0.3, width: 100, height: 70, }} >
                    <ListItemButton sx={{ width: '100%', height: '100%' }}>
                        <ListItemIcon sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
                            <img src="./logo/sky.png" alt="logo" style={{ width: '90px', height: '90px', backgroundPosition: "center", backgroundRepeat: "no-repeat" }} />
                        </ListItemIcon>
                    </ListItemButton>
                </ListItem> */}
                <ListItem disablePadding sx={{ background: "white", mb: 0.3, width: '100%', height: 69, }} >
                    <ListItemButton sx={{ width: '100%', height: '100%' }}>
                        <ListItemIcon sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
                            <img src="./logo/sky.png" alt="logo" style={{ width: '160px', height: '120px', backgroundPosition: "center", backgroundRepeat: "no-repeat" }} />
                        </ListItemIcon>
                    </ListItemButton>
                </ListItem>

                {/* dashboard */}
                <Link to={'/'} style={{ textDecoration: 'none' }}>
                    <Tooltip title="Dashboard" placement='right'>
                        <ListItem disablePadding sx={{ background: menu.active === 0 ? menuAtive : menuInActive, color: menu.active === 0 ? textActive : textInActive, mb: 0.3, width: "100%", height: 70, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setMenu({ name: "Dashboard", active: 0 })}>
                            <ListItemButton sx={{ width: '100%', height: '100%' }}>
                                <ListItemIcon sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
                                    {/* <img src="./assets/menu/material-symbols-light_dashboard-rounded.svg" alt="star" style={{color: colors.grey[200], backgroundColor: colors.grey[200]}} /> */}
                                    <MdDashboard style={{ width: 25, height: 25, color: menu.active === 0 ? textActive : textInActive }} />
                                    <ListItemText primary={"Dashboard"} sx={{ textDecoration: 'none', color: menu.active === 0 ? textActive : textInActive, marginLeft: 1 }} />
                                </ListItemIcon>
                            </ListItemButton>
                        </ListItem>
                    </Tooltip>
                </Link>

                {/* Users */}
                {/* <Link to={'/users'}>
                    <Tooltip title="Users" placement='right'>
                        <ListItem disablePadding sx={{ background: name === 'Users' ? menuAtive : menuInActive, color: name === 'Users' ? textActive : textInActive, mb: 0.3, width: 100, height: 70, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => activeMenu('Users')}>
                            <ListItemButton sx={{ width: '100%', height: '100%' }}>
                                <ListItemIcon sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
                                    <FaUsers style={{ width: 25, height: 25, color: name === 'Users' ? textActive : textInActive }} />
                                </ListItemIcon>
                            </ListItemButton>
                        </ListItem>
                    </Tooltip>
                </Link> */}


                {/* users */}
                <Link to={'/users'} style={{ textDecoration: 'none' }}>
                    <Tooltip title="Vender" placement='right'>
                        <ListItem disablePadding sx={{ background: menu.active === 1 ? menuAtive : menuInActive, color: menu.active === 1 ? textActive : textInActive, mb: 0.3, width: "100%", height: 70, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setMenu({ name: "Vender", active: 1 })}>
                            <ListItemButton sx={{ width: '100%', height: '100%' }}>
                                <ListItemIcon sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
                                    {/* <img src="./assets/menu/material-symbols-light_dashboard-rounded.svg" alt="star" style={{color: colors.grey[200], backgroundColor: colors.grey[200]}} /> */}
                                    <FaUsers style={{ width: 25, height: 25, color: menu.active === 1 ? textActive : textInActive }} />
                                    <ListItemText primary={"Vender"} sx={{ textDecoration: 'none', color: menu.active === 1 ? textActive : textInActive, marginLeft: 1 }} />
                                </ListItemIcon>
                            </ListItemButton>
                        </ListItem>
                    </Tooltip>
                </Link>

                {/* plans */}
                <Link to={'/plans'} style={{ textDecoration: 'none' }}>
                    <Tooltip title="Plans" placement='right'>
                        <ListItem disablePadding sx={{ background: menu.active === 2 ? menuAtive : menuInActive, color: menu.active === 2 ? textActive : textInActive, mb: 0.3, width: "100%", height: 70, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setMenu({ name: "Plans", active: 2 })}>
                            <ListItemButton sx={{ width: '100%', height: '100%' }}>
                                <ListItemIcon sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
                                    {/* <img src="./assets/menu/material-symbols-light_dashboard-rounded.svg" alt="star" style={{color: colors.grey[200], backgroundColor: colors.grey[200]}} /> */}
                                    <RiMoneyDollarCircleFill style={{ width: 25, height: 25, color: menu.active === 2 ? textActive : textInActive }} />
                                    <ListItemText primary={"Plans"} sx={{ textDecoration: 'none', color: menu.active === 2 ? textActive : textInActive, marginLeft: 1 }} />
                                </ListItemIcon>
                            </ListItemButton>
                        </ListItem>
                    </Tooltip>
                </Link>

                {/* plans */}
                <Link to={'/apis'} style={{ textDecoration: 'none' }}>
                    <Tooltip title="Keys" placement='right'>
                        <ListItem disablePadding sx={{ background: menu.active === 3 ? menuAtive : menuInActive, color: menu.active === 3 ? textActive : textInActive, mb: 0.3, width: "100%", height: 70, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setMenu({ name: "Keys", active: 3 })}>
                            <ListItemButton sx={{ width: '100%', height: '100%' }}>
                                <ListItemIcon sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
                                    <IoKey style={{ width: 25, height: 25, color: menu.active === 3 ? textActive : textInActive }} />
                                    <ListItemText primary={"Keys"} sx={{ textDecoration: 'none', color: menu.active === 3 ? textActive : textInActive, marginLeft: 1 }} />
                                </ListItemIcon>
                            </ListItemButton>
                        </ListItem>
                    </Tooltip>
                </Link>

            </Drawer>
            <Box component="main" sx={{ flexGrow: 1, bgcolor: 'background.default', p: 3 }} >
                <Toolbar />
                {/* <Header theme={theme} /> */}
                <Routes>
                    <Route path='/' element={<Home admin={admin} />} />
                    <Route path='/users' element={<Users />} />

                    <Route path='/plans' element={<Plan />} />
                    <Route path='/plan/add' element={<AddPlan />} />
                    <Route path='/plan/edit/:id' element={<AddPlan />} />

                    <Route path='/apis' element={<Credentials />} />
                    {/* <Route path='/plan' element={<Plan pageName={name} />} />
                    <Route path='/plan/:id' element={<PlanView pageName={name} />} />
                    <Route path='/plan/add' element={<PlanAdd pageName={name} />} />
                    <Route path='/plan/edit/:id' element={<PlanAdd pageName={name} />} /> */}


                    {/* <Route path='/users' element={<Users pageName={name} />} /> */}
                </Routes>
            </Box>
        </Box>
    )
}

export default Dashboard