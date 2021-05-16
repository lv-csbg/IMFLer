// Adapted from https://github.com/johnculviner/jquery.fileDownload
// The MIT License (MIT)
//
// Copyright (c) 2021 Rudolfs Petrovs
// Copyright (c) 2014 John Culviner
//
// Permission is hereby granted, free of charge, to any person obtaining a copy of
// this software and associated documentation files (the "Software"), to deal in
// the Software without restriction, including without limitation the rights to
// use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
// the Software, and to permit persons to whom the Software is furnished to do so,
// subject to the following conditions:
// 
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
// 
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
// FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
// COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
// IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
// CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
// ----------------------------------------------------------------------------
const downloadToFile = (content, filename, contentType) => {
    const blob = new Blob([content], {
        type: contentType
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
};
// ----------------------------------------------------------------------------

// Adapted from https://github.com/darkskyapp/string-hash
// Copyright right are waived
// ----------------------------------------------------------------------------
String.prototype.hash = function() {
    var hash = 5381,
        i = this.length;
    while (i) {
        hash = (hash * 33) ^ this.charCodeAt(--i);
    }
    return (hash >>> 0).toString(16);

};
// ----------------------------------------------------------------------------
