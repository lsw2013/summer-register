
function a() {
    let a = '123';
    try {
        a = JSON.parse('a"');
    }
    catch (e) {
        return;
        if (e) {
            console.log('err: ');
            console.log(e);
            return;
        }
        else {
            console.log(a);
        }
        console.log(a);
    }
    console.log('hahahah');
    console.log(a);
}

a();