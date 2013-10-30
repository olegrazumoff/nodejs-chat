function run() {
    var win = document.getElementById("swim");
    window.setInterval(move(win), 40);
}

function move(win) {
    var left = parseInt(win.style.left);
    var top = parseInt(win.style.top);
    var angleStep = Math.PI / 64;
    var angle = 0;
    var opacity = 0.5;
    var opacityStep = 0.1;
    var radius = 50;
    return function() {
        var x = radius * Math.cos(angle) + left;
        var y = radius * Math.sin(angle) + top;
        win.style.left = x + "px";
        win.style.top = y + "px";
        win.style.opacity = opacity;
        angle += angleStep;
        opacity += opacityStep;
        if(angle >= 2 * Math.PI) {
            angle = 0;
        }
        if(opacity >= 1 || opacity <= 0) {
            opacityStep *= -1;
        }

    }
}

function report(element, event) {
    if ((element.type == "select-one") ||
        (element.type == "select-multiple")){
        value = " ";
        for(var i = 0; i < element.options.length; i++)
            if (element.options[i].selected)
                value += element.options[i].value + " ";
    }
    else if (element.type == "textarea") value = "...";
    else value = element.value;
    var msg = event + ": " + element.name + ' (' + value + ')\n';
    var t = element.form.textarea;
    t.value = t.value + msg;
}

function addhandlers(f) {
// Цикл по всем элементам формы.
    for(var i = 0; i < f.elements.length; i++) {
        var e = f.elements[i];
        e.onclick = function() { report(this, 'Click'); }
        e.onchange = function() { report(this, 'Change'); }
        e.onfocus = function() { report(this, 'Focus'); }
        e.onblur = function() { report(this, 'Blur'); }
        e.onselect = function() { report(this, 'Select'); }
    }
// Определить специальные обработчики событий для трех кнопок.
    f.clearbutton.onclick = function() {
        this.form.textarea.value=''; report(this,'Click');
    }
    f.submitbutton.onclick = function () {
        report(this, 'Click'); return false;
    }
    f.resetbutton.onclick = function( ) {
        this.form.reset( ); report(this, 'Click'); return false;
    }
}