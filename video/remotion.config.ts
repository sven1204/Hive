import { Config } from "@remotion/cli/config";

Config.setVideoImageFormat("jpeg");
Config.setJpegQuality(92);
Config.setConcurrency(4);
// WebGL (bulles 3D React Three Fiber) : rendu GPU via ANGLE
Config.setChromiumOpenGlRenderer("angle");
Config.setCodec("h264");
Config.setCrf(18);
Config.setPixelFormat("yuv420p");
