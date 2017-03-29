import { isSet } from '../utils';

import * as validators from '../validation/validators';
import { IFieldValidator, IAsyncFieldValidator } from '../validation/validators';
import { Model } from '../models/model';
import { IModelMeta } from '../models/meta';
import { IModelOperation } from '../operations/operation';
import { ModelValidationResult } from '../validation/validationresult';
import { IValidationOptions } from '../operations/validate';

export interface IFieldOptions {
    label?: string;
    required?: boolean;
}

export const DEFAULT_FIELD_OPTIONS: IFieldOptions = {
    required: true
};

export function getOptions(options?: IFieldOptions): IFieldOptions {
    if (isSet(options)) {
        if (typeof options != 'object') {
            throw new Error('FieldError: the options parameter must be an object');
        }
        return Object.assign({}, DEFAULT_FIELD_OPTIONS, options);
    }
    else {
        return Object.assign({}, DEFAULT_FIELD_OPTIONS);
    }
}

export class Field {
    validators: IFieldValidator[];
    asyncValidators: IAsyncFieldValidator[];

    constructor(public name: string, public options?: IFieldOptions) {
        if (!name || typeof name != 'string') {
            throw new Error('FieldError: new fields must have a name');
        }
        this.options = getOptions(options);
        this.validators = [];
        this.asyncValidators = [];
        if (this.options.required || typeof this.options.required == 'undefined') {
            this.validators.push(validators.requiredValidator);
        }
    }

    validate<T extends Model>(model: T, meta: IModelMeta, operation: IModelOperation, result: ModelValidationResult, options?: IValidationOptions): Promise<ModelValidationResult> {
        let timeout = options && options.timeout ? options.timeout : 5000;
        return new Promise((resolve, reject) => {
            // Run synchronous validators
            for (let validator of this.validators) {
                validator(model, this, meta, operation, result, options);
            }
            // Run asynchronous validators
            if (this.asyncValidators.length > 0) {
                let promises: Array<Promise<void>> = [];
                for (let asyncValidator of this.asyncValidators) {
                    promises.push(asyncValidator(model, this, meta, operation, result, options));
                }
                Promise.all(promises)
                    .then(() => {
                        resolve(result);
                    });
                setTimeout(() => {
                    reject(new Error(`Field validate() - timed out after ${timeout} milliseconds`));
                }, timeout);
            }
            else {
                // Resolve immediately
                resolve(result);
            }
        });
    }
}
