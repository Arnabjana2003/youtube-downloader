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
  try{
    const {videoUrl} = req.body
    if(!videoUrl) return new ApiError(400,"videoUrl is reqired")

    const videoInfo = await ytdl.getInfo(videoUrl);
    if(!videoInfo) return new ApiError (404,"video not found");

    const audioFormats = ytdl.filterFormats(videoInfo.formats, 'audioonly');

    if (audioFormats.length === 0) {
      throw new Error('No audio-only formats available');
    }

    const audioFormat = ytdl.chooseFormat(audioFormats, { quality: 'highestaudio' })
    const videoFormat = videoInfo.formats.filter((item)=>item.hasAudio==true&&item.hasVideo==true)
    return res
    .status(200)
    .json({audioUrl:audioFormat.url,videoUrl:videoFormat[0].url})
  }catch(err){
    return new ApiError(400,err)
  }
})


app.listen(process.env.PORT || 6000, () => {
  console.log(`Server is running on port ${process.env.PORT || 6000}`);
});
