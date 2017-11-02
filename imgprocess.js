// Copyright 2013 by András Péter
// Licensed under the GNU General Public License v3: http://www.gnu.org/licenses/gpl.html

function imgprocess(
    // Image data from a canvas element's getImageData function
    pixels,
    // Apply deuteranopia effect? (boolean)
    deuter,
    // Apply "decreased brightness discrimination" effect? (boolean)
    decbright,
    // Factor by which to reduce visual acuity (int?)
    decac
    ) {
	
	// Start measuring execution time
	starttime = new Date().getTime();

    // Prepare variables necessary for processing the image
    var
        // Width of image
        imgWidth = pixels.width,
        // Height of image
        imgHeight = pixels.height,
        // Array for storing original pixel data
        data = new Array((imgWidth * imgHeight) << 2),
        // Array for storing modified pixel data
        tdata = new Array((imgWidth * imgHeight) << 2),
        // Loop counter
        r = 0,
        // Variables for storing color values temporarily
        redtemp = greentemp = bluetemp = 0,
        // Variable for storing overall average brightness and brightness correction
        brighto = 0,
        brightc = 0,
        // Value used for gamma compression
        gc = 1 / 2.2,
        // Counter variables for marking upper and lower boundry of blurring window
        brl = brhh = 0,
        // Four times the width of the image, used to step counter variables at vertical pass
        imgWF = imgWidth * 4;

    // If the number of perceived colors should be decreased...
    if (deuter) {

      // Do gamma expansion and move pixel data into the array for storing modified pixel data...
      for (var i = 0; i < imgWidth; i++) {
        for (var j = 0; j < imgHeight; j++) {
        
          // ...at the same time sum the values of each channel for calculating average brightness
          redtemp += tdata[r] = Math.pow(pixels.data[r], 2.2);r++;
          greentemp += tdata[r] = Math.pow(pixels.data[r], 2.2);r++;
          bluetemp += tdata[r] = Math.pow(pixels.data[r], 2.2);r -= 2;

          // Merge red and green channels
          tdata[r + 1] = (tdata[r] + tdata[r + 1]) * 0.5;

          r += 4;
        }
      }

      // Calculate average brightness for each channel
      redtemp = redtemp / (imgWidth * imgHeight);
      greentemp = greentemp / (imgWidth * imgHeight);
      bluetemp = bluetemp / (imgWidth * imgHeight);

      // Calculate overal average brightness
	  brighto = redtemp * 0.30 + greentemp * 0.59 + bluetemp * 0.11;
	  
	  // Calculate brightness correction needed after merging red and green channels
	  brightc = brighto / (redtemp * 0.30 + (redtemp + greentemp) * 0.5 * 0.59 + bluetemp * 0.11);

      // Start incremental bilinear blur:
      // -decac is the factor by which to reduce visual acuity
      // -brad is the half width/height of the averaging window at the actual pass
      for (var brad = 1; brad < decac; brad++) {

        var
            // Value for dividing summed pixel values of the averaging window
            bradvtrec = 1 / (brad * 4),
            // Image width decreased by half of the averaging window's width (to avoid border problems)
            imgWmb = imgWidth - brad,
            // Image height decreased by half of the averaging window's height (to avoid border problems)
            imgHmb = imgHeight - brad;

        // Move modified pixel data to array storing original pixel data
        r = 1;
        for (var i = 0; i < imgWidth; i++) {
          for (var j = 0; j < imgHeight; j++) {
            data[r] = tdata[r];r++;
            data[r] = tdata[r];r += 3;
          }
        }

        // Do vertical pass
        for (var i = 0; i < imgWidth; i++) {

          // Set upper and lower bound of averaging window
          brl = brhh = (i << 2) + 1;

          // Fill temporary variables with the pixel value of the upper border
          greentemp = data[brl] * (brad + brad + 1);
          bluetemp = data[brl + 1] * (brad + brad + 1);

          // Fill the rest of the temporary variables with the pixel values near the border
          for (var bj = 1; bj < brad; bj++) {
            if  (bj < imgHeight-1) {brhh += imgWF}
            greentemp += data[brhh] + data[brhh];
            bluetemp += data[brhh + 1] + data[brhh + 1];
          }

          if  (brad < imgHeight-1) {brhh += imgWF}
          greentemp += data[brhh];
          bluetemp += data[brhh + 1];

          // Produce the average of the averaging window and store it in the array for modified pixel values
          r = (i << 2) + 1;
          tdata[r] = greentemp * bradvtrec;
          tdata[r + 1] = bluetemp * bradvtrec;

          // Do vertical pass at the current column
          for (var j = 1; j < imgHeight; j++) {

            // Remove uppermost pixel values from the temporary variables
            greentemp -= data[brl];
            bluetemp -= data[brl + 1];

            // Increase variable containing upper bound of averaging window
            if (j > brad) {brl += imgWF}

            // Remove uppermost pixel values from the temporary variables
            greentemp -= data[brl];
            bluetemp -= data[brl + 1];

            // Add the pixel values at the lowest position of the averaging window to the temporary variables
            greentemp += data[brhh];
            bluetemp += data[brhh + 1];

            // Increase variable containing lower bound of averaging window
            if (j < imgHmb) {brhh += imgWF}

            // Add the pixel values at the lowest position of the averaging window to the temporary variables
            greentemp += data[brhh];
            bluetemp += data[brhh + 1];

            // Produce the average of the averaging window and store it in the array for modified pixel values
            r += imgWF;
            tdata[r] = greentemp * bradvtrec;
            tdata[r + 1] = bluetemp * bradvtrec;
          }
        }

        // Move modified pixel data to array storing original pixel data
        r = 1;
        for (var i = 0; i < imgWidth; i++) {
          for (var j = 0; j < imgHeight; j++) {
            data[r] = tdata[r];r++;
            data[r] = tdata[r];r += 3;
          }
        }

        // Do horizontal pass
        for (var j = 0; j < imgHeight; j++) {

          // Set left and right bound of averaging window
          brl = brhh = ((j * imgWidth) << 2) + 1;

          // Fill temporary variables with the pixel value of the left border
          greentemp = data[brl] * (brad + brad + 1);
          bluetemp = data[brl + 1] * (brad + brad + 1);

          // Fill the rest of the temporary variables with the pixel values near the border
          for (var bi = 1; bi < brad; bi++) {
            if  (bi < imgWidth-1) {brhh += 4}
            greentemp += data[brhh] + data[brhh];
            bluetemp += data[brhh + 1] + data[brhh + 1];
          }

          if  (brad < imgWidth-1) {brhh += 4}
          greentemp += data[brhh];
          bluetemp += data[brhh + 1];

          // Produce the average of the averaging window and store it in the array for modified pixel values
          r = ((j * imgWidth) << 2) + 1;
          tdata[r] = greentemp * bradvtrec;
          tdata[r + 1] = bluetemp * bradvtrec;

          // Do horizontal pass at the current row
          for (var i = 1; i < imgWidth; i++) {

            // Remove leftmost pixel values from the temporary variables
            greentemp -= data[brl];
            bluetemp -= data[brl + 1];

            // Increase variable containing left bound of averaging window
            if (i > brad) {brl += 4}

            // Remove leftmost pixel values from the temporary variables
            greentemp -= data[brl];
            bluetemp -= data[brl + 1];

            // Add the pixel values at the rightmost position of the averaging window to the temporary variables
              greentemp += data[brhh];
            bluetemp += data[brhh + 1];

            // Increase variable containing right bound of averaging window
            if (i < imgWmb) {brhh += 4}

            // Add the pixel values at the rightmost position of the averaging window to the temporary variables
            greentemp += data[brhh];
            bluetemp += data[brhh + 1];

            // Produce the average of the averaging window and store it in the array for modified pixel values
            r += 4;
            tdata[r] = greentemp * bradvtrec;
            tdata[r + 1] = bluetemp * bradvtrec;
          }
        }
      }

      // If the contrast should be decreased...
      if (decbright) {

        r = 0;
        for (var i = 0; i < imgWidth; i++) {
          for (var j = 0; j < imgHeight; j++) {

            // Half the pixel values, compensate for brightness loss and do gamma compression
            pixels.data[r + 1] = Math.pow((tdata[r + 1] * brightc + brighto) * 0.5, gc);
            pixels.data[r + 2] = Math.pow((tdata[r + 2] * brightc + brighto) * 0.5, gc);

            // Red and green pixel values are the same
            pixels.data[r] = pixels.data[r + 1];

            r += 4;
          }
        }

      }

      // If the contrast should not be decreased...
      else {

        r = 0;
        for (var i = 0; i < imgWidth; i++) {
          for (var j = 0; j < imgHeight; j++) {

            // Compensate for brightness loss and do gamma compression
            pixels.data[r + 1] = Math.pow(tdata[r + 1] + brighto, gc);
            pixels.data[r + 2] = Math.pow(tdata[r + 2] + brighto, gc);

            // Red and green pixel values are the same
            pixels.data[r] = pixels.data[r + 1];

            r += 4;
          }
        }
      }

    }

    // If the number of perceived colors should not be decreased...
    else {

      // If the contrast should be decreased...
      if (decbright) {

        // Do gamma expansion and move pixel data into the array for storing modified pixel data...
        for (var i = 0; i < imgWidth; i++) {
          for (var j = 0; j < imgHeight; j++) {

            // ...at the same time sum the values of each channel for calculating average brightness
            redtemp += tdata[r] = Math.pow(pixels.data[r], 2.2);r++;
            greentemp += tdata[r] = Math.pow(pixels.data[r], 2.2);r++;
            bluetemp += tdata[r] = Math.pow(pixels.data[r], 2.2);r += 2;
          }
        }

        // Calculate average brightness for each channel
        redtemp = redtemp / (imgWidth * imgHeight);
        greentemp = greentemp / (imgWidth * imgHeight);
        bluetemp = bluetemp / (imgWidth * imgHeight);

        // Calculate the overall average brightness
        brighto = redtemp * 0.30 + greentemp * 0.59 + bluetemp * 0.11;
      }

      // If the contrast should not be decreased...
      else {

        // Do gamma expansion and move pixel data into the array for storing modified pixel data
        for (var i = 0; i < imgWidth; i++) {
          for (var j = 0; j < imgHeight; j++) {
            tdata[r] = Math.pow(pixels.data[r], 2.2);r++;
            tdata[r] = Math.pow(pixels.data[r], 2.2);r++;
            tdata[r] = Math.pow(pixels.data[r], 2.2);r += 2;
          }
        }
      }

      // Start incremental bilinear blur:
      // -decac is the factor by which to reduce visual acuity
      // -brad is the half width/height of the averaging window at the actual pass
      for (var brad = 1; brad < decac; brad++) {

        var
            // Value for dividing summed pixel values of the averaging window
            bradvtrec = 1 / (brad * 4),
            // Image width decreased by half of the averaging window's width (to avoid border problems)
            imgWmb = imgWidth - brad,
            // Image height decreased by half of the averaging window's height (to avoid border problems)
            imgHmb = imgHeight - brad;

        // Move modified pixel data to array storing original pixel data
        r = 0;
        for (var i = 0; i < imgWidth; i++) {
          for (var j = 0; j < imgHeight; j++) {
            data[r] = tdata[r];r++;
            data[r] = tdata[r];r++;
            data[r] = tdata[r];r += 2;
          }
        }

        // Do vertical pass
        for (var i = 0; i < imgWidth; i++) {

          // Set upper and lower bound of averaging window
          brl = brhh = (i << 2);

          // Fill temporary variables with the pixel value of the upper border
          redtemp = data[brl] * (brad + brad + 1);
          greentemp = data[brl + 1] * (brad + brad + 1);
          bluetemp = data[brl + 2] * (brad + brad + 1);

          // Fill the rest of the temporary variables with the pixel values near the border
          for (var bj = 1; bj < brad; bj++) {
            if  (bj < imgHeight-1) {brhh += imgWF}
            redtemp += data[brhh] + data[brhh];
            greentemp += data[brhh + 1] + data[brhh + 1];
            bluetemp += data[brhh + 2] + data[brhh + 2];
          }

          if  (brad < imgHeight-1) {brhh += imgWF}
          redtemp += data[brhh];
          greentemp += data[brhh + 1];
          bluetemp += data[brhh + 2];

          // Produce the average of the averaging window and store it in the array for modified pixel values
             r = (i << 2);
          tdata[r] = redtemp * bradvtrec;
          tdata[r + 1] = greentemp * bradvtrec;
          tdata[r + 2] = bluetemp * bradvtrec;

          // Do vertical pass at the current column
          for (var j = 1; j < imgHeight; j++) {

            // Remove uppermost pixel values from the temporary variables
            redtemp -= data[brl];
            greentemp -= data[brl + 1];
            bluetemp -= data[brl + 2];

            // Increase variable containing upper bound of averaging window
            if (j > brad) {brl += imgWF}

            // Remove uppermost pixel values from the temporary variables
            redtemp -= data[brl];
            greentemp -= data[brl + 1];
            bluetemp -= data[brl + 2];

            // Add the pixel values at the lowest position of the averaging window to the temporary variables
            redtemp += data[brhh];
            greentemp += data[brhh + 1];
            bluetemp += data[brhh + 2];

            // Increase variable containing lower bound of averaging window
            if (j < imgHmb) {brhh += imgWF}

            // Add the pixel values at the lowest position of the averaging window to the temporary variables
            redtemp += data[brhh];
            greentemp += data[brhh + 1];
            bluetemp += data[brhh + 2];

            // Produce the average of the averaging window and store it in the array for modified pixel values
            r += imgWF;
            tdata[r] = redtemp * bradvtrec;
            tdata[r + 1] = greentemp * bradvtrec;
            tdata[r + 2] = bluetemp * bradvtrec;
          }
        }

        // Move modified pixel data to array storing original pixel data
        r = 0;
        for (var i = 0; i < imgWidth; i++) {
          for (var j = 0; j < imgHeight; j++) {
            data[r] = tdata[r];r++;
            data[r] = tdata[r];r++;
            data[r] = tdata[r];r += 2;
          }
        }

        // Do horizontal pass
        for (var j = 0; j < imgHeight; j++) {

          // Set left and right bound of averaging window
          brl = brhh = ((j * imgWidth) << 2);

          // Fill temporary variables with the pixel value of the left border
          redtemp = data[brl] * (brad + brad + 1);
          greentemp = data[brl + 1] * (brad + brad + 1);
          bluetemp = data[brl + 2] * (brad + brad + 1);

          // Fill the rest of the temporary variables with the pixel values near the border
          for (var bi = 1; bi < brad; bi++) {
            if  (bi < imgWidth-1) {brhh += 4}
            redtemp += data[brhh] + data[brhh];
            greentemp += data[brhh + 1] + data[brhh + 1];
            bluetemp += data[brhh + 2] + data[brhh + 2];
          }

          if  (brad < imgWidth-1) {brhh += 4}
          redtemp += data[brhh];
          greentemp += data[brhh + 1];
          bluetemp += data[brhh + 2];

          // Produce the average of the averaging window and store it in the array for modified pixel values
          r = ((j * imgWidth) << 2);
          tdata[r] = redtemp * bradvtrec;
          tdata[r + 1] = greentemp * bradvtrec;
          tdata[r + 2] = bluetemp * bradvtrec;

          // Do horizontal pass at the current row
          for (var i = 1; i < imgWidth; i++) {

            // Remove leftmost pixel values from the temporary variables
            redtemp -= data[brl];
            greentemp -= data[brl + 1];
            bluetemp -= data[brl + 2];

            // Increase variable containing left bound of averaging window
            if (i > brad) {brl += 4}

            // Remove leftmost pixel values from the temporary variables
            redtemp -= data[brl];
            greentemp -= data[brl + 1];
            bluetemp -= data[brl + 2];

            // Add the pixel values at the rightmost position of the averaging window to the temporary variables
            redtemp += data[brhh];
            greentemp += data[brhh + 1];
            bluetemp += data[brhh + 2];

            // Increase variable containing right bound of averaging window
            if (i < imgWmb) {brhh += 4}

            // Add the pixel values at the rightmost position of the averaging window to the temporary variables
            redtemp += data[brhh];
            greentemp += data[brhh + 1];
            bluetemp += data[brhh + 2];

            // Produce the average of the averaging window and store it in the array for modified pixel values
            r += 4;
            tdata[r] = redtemp * bradvtrec;
            tdata[r + 1] = greentemp * bradvtrec;
            tdata[r + 2] = bluetemp * bradvtrec;
          }
        }
      }

      // If the contrast should be decreased...
      if (decbright) {

        r = 0;
        for (var i = 0; i < imgWidth; i++) {
          for (var j = 0; j < imgHeight; j++) {

            // Half the pixel values, compensate for brightness loss and do gamma compression
            pixels.data[r] = Math.pow((tdata[r] + brighto) * 0.5, gc);r++;
            pixels.data[r] = Math.pow((tdata[r] + brighto) * 0.5, gc);r++;
            pixels.data[r] = Math.pow((tdata[r] + brighto) * 0.5, gc);r += 2;
          }
        }
      }

      // If the contrast should not be decreased...
      else {

        r = 0;
        for (var i = 0; i < imgWidth; i++) {
          for (var j = 0; j < imgHeight; j++) {

            // Do gamma compression
            pixels.data[r] = Math.pow(tdata[r], gc);r++;
            pixels.data[r] = Math.pow(tdata[r], gc);r++;
            pixels.data[r] = Math.pow(tdata[r], gc);r += 2;
          }
        }
      }

    }

    // Send back pixel data to the calling script
    return pixels;

};
