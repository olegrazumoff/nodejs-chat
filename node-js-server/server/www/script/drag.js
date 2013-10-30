/**
 * Drag.js: перетаскивание абсолютно позиционируемых HTML элементов.
 *
 * Данный модуль определяет единственную функцию drag(),
 * которая предназначена для вызова из обработчика события onmousedown.
 * Последующие события mousemove будут вызывать перемещение заданного элемента.
 * Событие mouseup завершит операцию перетаскивания.
 * Если элемент перемещается за пределы экрана, окно прокручиваться не будет.
 * Данная реализация работает в обеих моделях: DOM уровня 2 и IE.
 *
 * Аргументы:
 *
 * elementToDrag: элемент, получивший событие mousedown или содержащий
 *
 его контейнерный элемент. Он должен позиционироваться в абсолютных
 *
 координатах. Значения его свойств style.left и style.top будут
 *
 изменяться по мере перетаскивания элемента пользователем.
 *
 * event: объект Event события mousedown.
 **/
var currentIndex = 1;

function drag(elementToDrag, event) {
// Координаты мыши (в оконных координатах)
// в точке, откуда начинается перемещение элемента
    var startX = event.clientX, startY = event.clientY;
// Начальная позиция (в координатах документа) перетаскиваемого элемента.
// Поскольку elementToDrag позиционируется в абсолютных
// координатах, предполагается, что его свойство offsetParent
// ссылается на элемент body документа.
    var origX = elementToDrag.offsetLeft, origY = elementToDrag.offsetTop;
    elementToDrag.style.zIndex = currentIndex++;
    elementToDrag.style.opacity = "0.75";
// Несмотря на то, что координаты исчисляются в различных системах
// координат, мы можем вычислить разницу между ними и использовать
// ее в функции moveHandler(). Этот прием будет работать,
// потому что при перетаскивании документ не прокручивается.
    var deltaX = startX - origX, deltaY = startY - origY;
// Зарегистрировать обработчики событий mousemove и mouseup,
// которые последуют вслед за событием mousedown.
    if (document.addEventListener) { // Модель событий DOM уровня 2
// Зарегистрировать перехватывающие обработчики событий
        document.addEventListener("mousemove", moveHandler, true);
        document.addEventListener("mouseup", upHandler, true);
    }
    else if (document.attachEvent) { // Модель событий IE 5+
// В модели обработки событий IE перехват событий производится
// вызовом метода setCapture() элемента, выполняющего перехват.
        elementToDrag.setCapture();
        elementToDrag.attachEvent("onmousemove", moveHandler);
        elementToDrag.attachEvent("onmouseup", upHandler);
// Интерпретировать событие потери перехвата как событие mouseup.
        elementToDrag.attachEvent("onlosecapture", upHandler);
    }
    else { // Модель событий IE 4
// В IE 4 мы не можем использовать attachEvent() или setCapture(),
// поэтому вставляем обработчики событий непосредственно в объект документа
// и уповаем на то, что требуемые события мыши всплывут
        var oldmovehandler = document.onmousemove; // Используется в upHandler()
        var olduphandler = document.onmouseup;
        document.onmousemove = moveHandler;
        document.onmouseup = upHandler;
    }
// Событие обработано, необходимо прервать его дальнейшее распространение.
    if (event.stopPropagation) event.stopPropagation( ); // DOM уровня 2
    else event.cancelBubble = true; // IE
// Теперь необходимо предотвратить выполнение действия по умолчанию.
    if (event.preventDefault) event.preventDefault( ); // DOM уровня 2
    else event.returnValue = false; // IE
    /**
     * Следующий обработчик перехватывает события mousemove в процессе
     * перетаскивания элемента. Он отвечает за перемещение элемента.
     **/
    function moveHandler(e) {
        if (!e) e = window.event; // Модель событий IE
// Переместить элемент в текущие координаты указателя мыши, при необходимости
// подстроить его позицию на смещение начального щелчка.
        elementToDrag.style.left = (e.clientX - deltaX) + "px";
        elementToDrag.style.top = (e.clientY - deltaY) + "px";
// И прервать дальнейшее распространение события.
        if (e.stopPropagation) e.stopPropagation( ); // DOM уровня 2
        else e.cancelBubble = true; // IE
    }
    /**
     * Этот обработчик перехватывает заключительное событие mouseup,
     * которое возникает в конце операции перетаскивания.
     **/
    function upHandler(e) {
        elementToDrag.style.opacity = "1";
        if (!e) e = window.event; // Модель событий IE
// Отменить регистрацию перехватывающих обработчиков событий.
        if (document.removeEventListener) { // Модель событий DOM
            document.removeEventListener("mouseup", upHandler, true);
            document.removeEventListener("mousemove", moveHandler, true);
        }
        else if (document.detachEvent) { // Модель событий IE 5+
            elementToDrag.detachEvent("onlosecapture", upHandler);
            elementToDrag.detachEvent("onmouseup", upHandler);
            elementToDrag.detachEvent("onmousemove", moveHandler);
            elementToDrag.releaseCapture();
        }
        else { // Модель событий IE 4
// Восстановить первоначальные обработчики, если они были
            document.onmouseup = olduphandler;
            document.onmousemove = oldmovehandler;
        }
// И прервать дальнейшее распространение события.
        if (e.stopPropagation) e.stopPropagation( ); // DOM уровня 2
        else e.cancelBubble = true; // IE
    }
}
