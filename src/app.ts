import express from 'express'

const xp = express();
const port = 3000;

xp.get('/', (req, res) => {
    res.send("Hello, World\n");
    console.log(`Request from: ${req.url}`)
})

xp.listen(port, () => {
    console.log(`Server listening on port: ${port}`)
})
