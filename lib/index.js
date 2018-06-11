const express = require('express')
const multer = require('multer')()
const path = require('path')
const fs = require('fs')
let app = express()
const { promisify } = require('util')

const getShortCode = () => {
  const charset = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
  let s = ''
  while (s.length < 6) {
    s += charset[Math.floor(Math.random(0, 63) * 100) % 62]
  }
  return s
}

const reducer = async (filenameArr, accessKey) => {
  return await filenameArr.reduce(async (accum, filename, index) => {
    try {
      let extension = filename.split('.')[1]
      let data = await readFile(accessKey, filename)
      accum.body += await `--${accum.boundary}\r\nContent-Disposition: form-data; name=${filename}\r\nContent-Type: image/${extension};base64\r\n\r\n${data}\r\n`
      return accum
    } catch (err) {
      throw new Error(err.message)
    }
  }, {
    body: '',
    boundary: '----WebKitFormBoundary7nEtAnyHu747Pu'
  })
}

const createMultiPart = async (filenameArr, accessKey) => {
  let {body, boundary} = await reducer(filenameArr, accessKey)
  body += await `--${boundary}--\r\n`
  return ({boundary, body})
}
const writeFile = async (accessKey, filename, buffer) => {
  try {
    return await fs.promises.writeFile(path.join(__dirname, 'upload', accessKey, filename), buffer)
  } catch (err) {
    throw new Error('Error in file writing: ', err)
  }
}
const readFile = async (accessKey, filename) => {
  try {
    let data = await fs.promises.readFile(path.join(__dirname, 'upload', accessKey, filename))
    let base64Data = await Buffer.from(data).toString('base64')
    return await base64Data
  } catch (err) {
    throw new Error('Error in reading file: ', err)
  }
}
app.get('/createAccessKey', (req, res) => {
  let accessKey = getShortCode()
  fs.appendFile(path.join(__dirname, 'upload', 'accessKey.json'), accessKey + ' ', (err, data) => {
    if (err) res.json({'status': 'error', message: 'Access key could not be saved'})
    else {
      console.log('Access Key Generated')
      res.json({'status': 'success', data: accessKey})
    }
  })
})
app.get('/image/:accessKey/:imageId', (req, res) => {
  fs.promises.readFile(path.join(__dirname, 'upload', 'accessKey.json'), 'utf-8')
    .then(accessKeysList => {
      if (accessKeysList.split(' ').filter(x => x === req.params.accessKey).length === 1) {
        res.sendFile(path.join(__dirname, 'upload', req.params.accessKey, `${req.params.imageId}.png`))
      } else {
        throw new Error('Access key is invalid')
      }
    })
    .catch(err => res.json({'status': 'error', 'message': err.message}))
})
app.get('/image/:accessKey', (req, res) => {
  let {accessKey} = req.params
  fs.promises.readFile(path.join(__dirname, 'upload', 'accessKey.json'), 'utf-8')
    .then(accessKeysList => {
      if (accessKeysList.split(' ').filter(x => x === accessKey).length === 1) {
        fs.promises.readdir(path.join(__dirname, 'upload', accessKey))
          .then(filenameArr => {
            createMultiPart(filenameArr, accessKey)
              .then(({boundary, body}) => {
                res.set({
                  'Content-Type': `multipart/form-data; boundary=${boundary}`,
                  'Content-Length': body.length
                })
                res.send(body)
              })
              .catch(error => res.json({'status': 'error', 'message': err.message}))
          })
          .catch(err => res.json({'status': 'error', 'message': err.message}))
      } else {
        throw new Error('Access key is invalid')
      }
    })
    .catch(err => res.json({'status': 'error', 'message': err.message}))
})
app.post('/image/:accessKey', multer.any(), (req, res) => {
  let {accessKey} = req.params
  fs.promises.readFile(path.join(__dirname, 'upload', 'accessKey.json'), 'utf-8')
  .then(accessKeysList => {
      if (accessKeysList.split(' ').filter(x => x === accessKey).length === 1) {
        fs.promises.stat(path.join(__dirname, 'upload', accessKey))
          .then(stat => {
            writeFile(accessKey, req.files[0].originalname, req.files[0].buffer)
              .then(data => res.json({'status': 'success', message: 'File created'}))
              .catch(err => res.json({'status': 'error', message: 'Error in file creation'}))
            return stat
          })
          .catch(error => {
            fs.promises.mkdir(path.join(__dirname, 'upload', accessKey))
              .then(mkdirData => {
                return writeFile(accessKey, req.files[0].originalname, req.files[0].buffer)
                  .then(data => res.json({'status': 'success', 'message': 'File Created'}))
                  .catch(err => res.json({'status': 'error', 'message':'Failed to create file'}))
              })
              .catch(error => res.json({'status': 'error', 'message': 'Failed to make directory'}))
          })
      } else {
        throw new Error('Access key is invalid')
      }
  })
    .catch(err => res.json({'status': 'error', 'message': err.message}))
})
app.patch('/image/:accessKey', multer.any(), (req, res) => {
  let { accessKey } = req.params
  fs.promises.readFile(path.join(__dirname, 'upload', 'accessKey.json'), 'utf-8')
  .then(accessKeysList => {
      if (accessKeysList.split(' ').filter(x => x === accessKey).length === 1) {
        fs.promises.stat(path.join(__dirname, 'upload', accessKey, req.files[0].originalname))
          .then(v => {
            writeFile(accessKey, req.files[0].originalname, req.files[0].buffer)
              .then(data => res.json({'status': 'success', 'message': 'File Updated'}))
              .catch(err => res.json({'status': 'error', 'message':'Failed to update file'}))
          })
          .catch(err1 => res.json({'status': 'error', 'message': 'Failed to find directory or file'}))
      } else {
        throw new Error('Access key is invalid')
      }
  })
    .catch(err => res.json({'status': 'error', 'message': err.message}))
})
app.delete('/image/:accessKey', multer.any(), (req, res) => {
  let { accessKey } = req.params
  let { filename } = req.body
   fs.promises.readFile(path.join(__dirname, 'upload', 'accessKey.json'), 'utf-8')
  .then(accessKeysList => {
      if (accessKeysList.split(' ').filter(x => x === accessKey).length === 1) {
        let filePath = path.join(__dirname, 'upload', accessKey, filename)
        fs.promises.stat(filePath)
          .then(v => {
            fs.promises.unlink(filePath)
              .then(data => res.json({'status': 'success', 'message': 'File Deleted'}))
              .catch(err => res.json({'status': 'error', 'message': 'Failed to delete file'}))
          })
          .catch(err => res.json({'status': 'error', message: 'Failed to find directory or file'}))
      } else {
        throw new Error('Access key is invalid')
      }
  })
    .catch(err => res.json({'status': 'error', 'message': err.message}))
})
app.listen(3000, () => console.log('Server is running on 3000'))

