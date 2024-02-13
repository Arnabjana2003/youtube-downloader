const express = require('express');
const ytdl = require('ytdl-core');
require('dotenv').config()
const fs = require('fs');
const app = express();
const cors = require('cors')

app.use(cors())

app.use(express.json());

class ApiError extends Error{
  constructor(
    statusCode,
    message
  ){
    super(message)
    this.statusCode = statusCode
    this.errors = message
    this.success = false
  }
}
app.get("/api",(req,res)=>res.send({message:"ok"}))

app.post('/api/getdetails',async(req,res)=>{
  try {
    const { videoUrl } = req.body;
    if(!videoUrl) return new ApiError(400,"videoUrl is reqired")

     const videoInfo = await ytdl.getInfo(videoUrl);
     if(!videoInfo) return new ApiError (404,"video not found");

     const formats = videoInfo.formats.filter(item=>item.hasAudio&&item.hasVideo)
     return res.status(200).json({formats})
  } catch (error) {
    return new ApiError(400,error)
  }
})
app.post('/api/download', async (req, res) => {
 try {
  console.log("started");
     const { videoUrl,quality } = req.body;
     if(!videoUrl || !quality) return new ApiError(400,"video url and video quality is requred")
     
     const videoInfo = await ytdl.getInfo(videoUrl);
     if(!videoInfo) return new ApiError (404,"video not found");

     const format = ytdl.chooseFormat(videoInfo.formats, quality);
     if(!format) return new ApiError (404,"something went wrong");
     
     const videoStream = ytdl.downloadFromInfo(videoInfo, quality);
     if(!videoStream) return new ApiError(500,"somthing went wrong while streaming video")

     const fileName = `video-${Date.now()}.${format.container}`;
     const filePath = `./downloads/${fileName}`;

     videoStream.pipe(fs.createWriteStream(filePath));

     videoStream.on('end', () => {
       console.log("done in backend");
       res.json({ downloadLink: `/api/download/${fileName}` });
     })
 } catch (error) {
    return new ApiError(400,error)
 };
});
app.get('/api/download/:fileName', (req, res) => {
  const { fileName } = req.params;
  const filePath = `./downloads/${fileName}`;
  try {
    res.download(filePath, fileName);
    setTimeout(()=>{
      fs.unlink(filePath, (err) => {
        if (err) {
          console.error('Error deleting file:', err);
        } else {
          console.log('File deleted successfully');
        }
      })
    },2000)
  } catch (error) {
    fs.unlink(filePath, (err) => {
      if (err) {
        console.error('Error deleting file:', err);
      } else {
        console.log('File deleted successfully');
      }
    })
    console.log("new ApiError::",error)
    return new ApiError(400,error)
  }
});

app.listen(process.env.PORT || 6000, () => {
  console.log(`Server is running on port ${process.env.PORT || 6000}`);
});
