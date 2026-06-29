import { Hono } from 'hono'

const app = new Hono()

app.get('/blogs', (c) => {
  return c.json({
    message:"All blogs will come here"
  })
})

app.get('/about', (c)=>{
  return c.json({
    message: "mini blog api"
  })
})


export default app
