/// <reference path="_ref.d.ts" />

var STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;
var FN_PARTS = /^function\s*[^\(]*\(\s*([^\)]*)\)/m;
var FN_ARG_SPLIT = /,\s*/;
var FN_NAME_PARTS = /_\$/;

class NestBootstraperRegistratorBasic implements Nest.IBootstraperRegistrator {

    constructor(public bootstrap: Nest.IBootstraper) {}

    reg(step: Nest.StepFunction) : (app: Nest.INest, done: () => any) => void {
        var args: Array < string > ;
        if (step.$serviceInject)
            args = step.$serviceInject;
        else {
            var fnText = step.toString().replace(STRIP_COMMENTS, '');
            var parts = fnText.match(FN_PARTS);

            if (parts && parts.length === 2) {

                if (!step.$serviceInject)
                    args = step.$serviceInject
                else if (parts[2].length > 0)
                    args = parts[2].split(FN_ARG_SPLIT).map((v, i, a) => {
                        return 'I' + v.charAt(0).toUpperCase() + v.slice(1);
                    });
                else
                    args = [];
            } else
                'NestContainerRegistratorBasic was not able to parse function: ' + step.toString();
        }

        return function(app: Nest.INest, done: () => any) {

            var ars: Array < any > = [];
            ars.push(app);
            ars.push(done);

            for (var i = 0; i < args.length; ++i) {
                var mod = app.modules.filter((xx, j, b) => {
                    return xx.name === args[i];
                })[0];
                ars.push(mod && mod.instance);
            }

            ars.unshift(app, done);

            step.apply(this, args);
        };
    }

    register(step: Array < Nest.StepFunction > );
    register(step: Nest.StepFunction);
    register(step: any) {

        if(typeof step === 'array')
            this.bootstrap.register((<Array < Nest.StepFunction >>step).map((x,i,a) => {
                    return this.reg(x);
                }));
        else
            this.bootstrap.register(this.reg(step));
    }
}

module.exports = NestBootstraperRegistratorBasic;