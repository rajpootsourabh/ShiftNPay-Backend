import { Box, Card, Typography } from '@mui/material'
import React from 'react'
import { AiOutlineUser } from "react-icons/ai";

function DashboardCard({ title, icon, count }) {
    return (
        <Card sx={{ width: '100%', border: '1px solid #108A00', height: 250, display: 'flex' }}>
            <Box sx={{ width: '60%', py: 4, pl: 4 }}>
                <Typography variant='h6' component={'div'} sx={{ color: '#747474' }} >{title ? title : ''}</Typography>
                <Typography variant='h3' component={'div'} sx={{ fontWeight: 700, color: '#108A00' }} >{count ? count : 0}</Typography>
            </Box>

            <Box sx={{ bgcolor: '#108A00', height: '80%', width: '40%', borderTopLeftRadius: '100%', alignSelf: 'flex-end', display: 'flex', alignItems: 'center', justifyContent: 'center', }}>
                {icon ? icon : ''}
            </Box>
        </Card>
    )
}

export default DashboardCard