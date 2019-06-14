import React, { useState, useEffect } from 'react'
import io from 'socket.io-client'
import { makeStyles } from '@material-ui/core/styles'
import Table from '@material-ui/core/Table'
import TableBody from '@material-ui/core/TableBody'
import TableCell from '@material-ui/core/TableCell'
import TableHead from '@material-ui/core/TableHead'
import TableRow from '@material-ui/core/TableRow'
import Paper from '@material-ui/core/Paper'
import dayjs from 'dayjs'
import formatBytes from '../lib/formatBytes'
const socket = io('http://localhost:3000')

const useStyles = makeStyles(theme => ({
  root: {
    width: '100%',
    marginTop: theme.spacing(3),
    overflowX: 'auto'
  },
  table: {
    minWidth: 650
  }
}))

const initialStats = {
  clients: [],
  jobs: []
}

export default function() {
  const classes = useStyles()
  const [stats, setStats] = useState(initialStats)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    socket.on('disconnect', () => {
      console.log('desconectat...')
      setLoading(true)
    })

    socket.on('stats', data => {
      if (loading) setLoading(false)
      setStats(data)
    })
  }, false)

  if (loading) return <div>Conectant...</div>
  else
    return (
      <div>
        {stats.clients.length === 0 ? (
          <div>No hi ha clients disponibles</div>
        ) : (
          <Paper className={classes.root}>
            <Table className={classes.table}>
              <TableHead>
                <TableRow>
                  <TableCell align="left">ID</TableCell>
                  <TableCell align="right">Wait</TableCell>
                  <TableCell align="right">Free</TableCell>
                  <TableCell align="right">Hostname</TableCell>
                  <TableCell align="right">Pid</TableCell>
                  <TableCell align="right">Job</TableCell>
                  <TableCell align="right">Running</TableCell>
                  <TableCell align="right">Client Uptime</TableCell>
                  <TableCell align="right">Memoria lliure</TableCell>
                  <TableCell align="right">Memoria Total</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {stats.clients.map(row => (
                  <TableRow key={row.id}>
                    <TableCell align="left">{row.id}</TableCell>
                    <TableCell align="right">
                      {row.wait < Date.now()
                        ? 'Segrest Inmediat'
                        : `Espera fins ${dayjs(row.wait).format('YYYY-MM-DD HH:mm:ss')}`}
                    </TableCell>
                    <TableCell align="right">{row.free ? 'Lliure' : 'Treballant'}</TableCell>
                    <TableCell align="right">{row.hostname}</TableCell>
                    <TableCell align="right">{row.pid}</TableCell>
                    <TableCell align="right">{JSON.stringify(row.job)}</TableCell>
                    <TableCell align="right">{dayjs().diff(row.running_job, 'seconds')}</TableCell>
                    <TableCell align="right">{row.uptime}</TableCell>
                    <TableCell align="right">{formatBytes(row.freemem)}</TableCell>
                    <TableCell align="right">{formatBytes(row.totalmem)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
        )}
        {stats.jobs.length === 0 ? (
          <div>No hi ha jobs disponibles</div>
        ) : (
          <Paper className={classes.root}>
            <Table className={classes.table}>
              <TableHead>
                <TableRow>
                  <TableCell align="left">Worker</TableCell>
                  <TableCell align="center">Word</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {stats.jobs.map((row, index) => (
                  <TableRow key={index}>
                    <TableCell align="left">{row.worker}</TableCell>
                    <TableCell align="center">{row.word}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
        )}
      </div>
    )
}
