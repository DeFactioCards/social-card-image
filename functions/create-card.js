const playwright = require("playwright-aws-lambda");

const buildUri = ({ queryStringParameters = {} }) => {
  const {
    cardpath = "https://social-card-image.netlify.app",
    id = "social-card",
    title = "No Title, Yet!",
    width,
    height,
  } = queryStringParameters;

  const dimensions = width && height ? `&width=${width}&height=${height}` : "";

  return {
    id,
    path: `${cardpath}?id=${id}&name=${name}&title=${title}${dimensions}`,
  };
};

const getBoundingSize = (uri) => {
  const ogBox = document.getElementById(uri.id);
  if (typeof ogBox === "undefined" || ogBox === null)
    return { x: 0, y: 0, width: 1920, height: 1080 };
  const { x, y, width, height } = ogBox.getBoundingClientRect();
  return { x, y, width, height };
};

exports.handler = async function (event) {
  try {
    const uri = buildUri(event);
    console.log("uri", uri.path);
    const browser = await playwright.launchChromium();
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.setViewportSize({
      width: 1920,
      height: 1080,
    });
    await page.goto(uri.path);

    await new Promise((resolve) => setTimeout(resolve, "100"));
    const boundingRect = await page.evaluate(getBoundingSize, uri);
    const screenshotBuffer = await page.screenshot({ clip: boundingRect });
    await browser.close();
    const base64Image = screenshotBuffer.toString("base64");

    return {
      isBase64Encoded: true,
      statusCode: 200,
      headers: {
        "Content-Type": "image/png",
        "Content-Length": `${screenshotBuffer.length}`,
      },
      body: base64Image,
    };
  } catch (error) {
    console.log(error);
    return { statusCode: error.statusCode || 500, body: error.message };
  }
};

exports.buildUri = buildUri;