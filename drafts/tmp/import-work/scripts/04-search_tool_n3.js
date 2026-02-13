function URLencode(str){
    var i, encoded_str, char_code, padded_str;
    encoded_str = "";
    for (i = 0; i < str.length; i++){
        char_code = str.charCodeAt(i);
        if (char_code == 0x20){
            encoded_str += "+";
        }
        else {
            if (((0x30 <= char_code) && (char_code <= 0x39)) || ((0x41 <= char_code) && (char_code <= 0x5a)) || ((0x61 <= char_code) && (char_code <= 0x7a))){
                encoded_str += str.charAt(i);
            }
            else if ((char_code == 0x2a) || (char_code == 0x2e) || (char_code == 0x2d) || (char_code == 0x5f)) {
                encoded_str += str.charAt(i);
            }
            else {
                if ( char_code > 0xffff ) {
                    encoded_str += "%" + ((char_code >> 18) | 0xf0).toString(16).toUpperCase();
                    encoded_str += "%" + (((char_code >> 12) & 0x3f) | 0x80).toString(16).toUpperCase();
                    encoded_str += "%" + (((char_code >> 6) & 0x3f) | 0x80).toString(16).toUpperCase();
                    encoded_str += "%" + ((char_code & 0x3f) | 0x80).toString(16).toUpperCase();
                }
                else if ( char_code > 0x7ff ) {
                    encoded_str += "%" + ((char_code >> 12) | 0xe0).toString(16).toUpperCase();
                    encoded_str += "%" + (((char_code >> 6) & 0x3f) | 0x80).toString(16).toUpperCase();
                    encoded_str += "%" + ((char_code & 0x3f) | 0x80).toString(16).toUpperCase();
                }
                else if ( char_code > 0x7f ) {
                    encoded_str += "%" + (((char_code >> 6) & 0x1f) | 0xc0).toString(16).toUpperCase();
                    encoded_str += "%" + ((char_code & 0x3f) | 0x80).toString(16).toUpperCase();
                }
                else {
                    padded_str = "0" + char_code.toString(16).toUpperCase();
                    encoded_str += "%" + padded_str.substr(padded_str.length - 2, 2);
                }
            }
        }
    }
    return encoded_str;
}

function mysearch(obj){
    if (obj.action.indexOf('https:') === 0) {
        var ActionProtcol = 'https';
    } else {
        var ActionProtcol = 'http';
    }
    url = ActionProtcol+'://search.marubeni.com/ja/?ref='+URLencode(location.href)+'&kw='+URLencode(obj.kw.value)+'&ie='+obj.ie.value+'&by=js';
    document.location.href=url;
    return false;
}

function mysearch2(obj){
    if (obj.action.indexOf('https:') === 0) {
        var ActionProtcol = 'https';
    } else {
        var ActionProtcol = 'http';
    }
    url = ActionProtcol+'://search.marubeni.com/ja/?ref='+URLencode(location.href)+'&kw='+URLencode(obj.kw.value)+'&ie='+obj.ie.value+'&do3='+obj.do3.value+'&by=js';
    document.location.href=url;
    return false;
}

function mysearch_new(obj){
    if (obj.action.indexOf('https:') === 0) {
        var ActionProtcol = 'https';
    } else {
        var ActionProtcol = 'http';
    }
    url = ActionProtcol+'://search.marubeni.com/ja/?ref='+URLencode(location.href)+'&kw='+URLencode(obj.kw.value)+'&ie='+obj.ie.value+'&do3='+obj.do3.value+'&temp='+obj.temp.value+'&by=js';
    document.location.href=url;
    return false;
}

function mysearch_new_report(obj){
    if (obj.action.indexOf('https:') === 0) {
        var ActionProtcol = 'https';
    } else {
        var ActionProtcol = 'http';
    }
    url = ActionProtcol+'://search.marubeni.com/ja/?ref='+URLencode(location.href)+'&kw='+URLencode(obj.kw.value)+'&ie='+obj.ie.value+'&do3='+obj.do3.value+'&temp='+obj.temp.value+'&do1[]='+obj['do1[]'].value+'&by=js';
    document.location.href=url;
    return false;
}

function mysearch_ord(obj){
    if (obj.action.indexOf('https:') === 0) {
        var ActionProtcol = 'https';
    } else {
        var ActionProtcol = 'http';
    }
    url = ActionProtcol+'://search.marubeni.com/ja/?ref='+URLencode(location.href)+'&kw='+URLencode(obj.kw.value)+'&ie='+obj.ie.value+'&do3='+obj.do3.value+'&temp='+obj.temp.value+'&do1[]='+obj['do1[]'].value+'&ord='+obj.ord.value+'&by=js';
    document.location.href=url;
    return false;
}

forSearchOnload(function() {
    // suggest
    var sBaseName = 'mbeni_ja';
    if ('https:' == document.location.protocol) {
        var sProtocol   = 'https';
    	var sDomainName = 'rsv.dga.jp';
    } else {
        var sProtocol   = 'http';
    	var sDomainName = 'cache.dga.jp';
    }
    var da = document.createElement('script');
    da.type = 'text/javascript'; da.async = true;
    da.src = sProtocol +'://' + sDomainName +'/s/'+ sBaseName +'/new_i_search_assist.js';
    document.body.appendChild(da);

    var cs  = document.createElement('link'); cs.type = 'text/css'; cs.rel = 'stylesheet';
    cs.href = sProtocol +'://'+  sDomainName  +'/s/'+ sBaseName +'/new_ac.css';
    document.body.appendChild(cs);
    
}); 
function forSearchOnload(func){
    try { 
        window.addEventListener("load", func, false); 
    } catch (e) { 
        window.attachEvent("onload", func); 
    } 
}
