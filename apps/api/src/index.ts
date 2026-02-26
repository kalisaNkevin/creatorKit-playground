import { Hono } from 'hono'

export type Env = {
  Bindings: {
    JOB_STATE: KVNamespace
    VIDEOS: R2Bucket
    ASSETS: R2Bucket
    JOB_QUEUE: Queue
  }
}

const app = new Hono<Env>()

app.get('/', (c) => {
  return c.json({ status: 'ok' })
})

export default app
