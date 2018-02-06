import {
    fields, ModelManager, InMemoryBackend,
    IntegerField, TextField, DateField, BooleanField, DateTimeField,
    AutoNumberField, NumberField, SelectField, TimeField,
    RelatedModel, RelatedModelList
} from 'rev-models';

export class User {
    @AutoNumberField({ primaryKey: true })
        id: number;
    @TextField()
        name: string;
    @DateField()
        date_registered: string;
    @RelatedModelList({ model: 'Post', field: 'user' })
        posts: Post[];

    constructor(data?: Partial<User>) {
        Object.assign(this, data);
    }

    userMethod1() {}
}

export class Post {
    @AutoNumberField({ primaryKey: true })
        id: number;
    @TextField()
        title: string;
    @TextField()
        body: string;
    @BooleanField()
        published: boolean;
    @DateTimeField()
        post_date: string;
    @RelatedModel({ model: 'User' })
        user: User;
    @RelatedModelList({ model: 'Comment', field: 'post' })
        comments: Comment[];

    constructor(data?: Partial<Post>) {
        Object.assign(this, data);
    }

    postMethod1() {}
    postMethod2() {}
    postMethod3() {}
}

export class Comment {
    @AutoNumberField({ primaryKey: true })
        id: number;
    @RelatedModel({ model: 'Post' })
        post: Post;
    @TextField()
        comment: string;
    @RelatedModel({ model: 'User' })
        user: User;

    constructor(data?: Partial<Comment>) {
        Object.assign(this, data);
    }
}

export class UnrelatedModel {
    @AutoNumberField({ primaryKey: true })
        id: number;
    @TextField()
        name: string;

    constructor(data?: Partial<User>) {
        Object.assign(this, data);
    }
}

export class UnknownField extends fields.Field {}

export class ModelWithUnknownField {
    unknownField: string;
    @AutoNumberField()
        id: number;
    @TextField()
        name: string;

    constructor(data?: Partial<User>) {
        Object.assign(this, data);
    }

    userMethod1() {}
}

export class ModelWithAllScalarFields {
    @AutoNumberField()
        autoNumberField: number;
    @IntegerField()
        integerField: number;
    @NumberField()
        numberField: number;
    @TextField()
        textField: string;
    @BooleanField()
        booleanField: boolean;
    @SelectField({ selection: [['Y', 'Yes'], ['N', 'No']] })
        selectionField: string;
    @DateField()
        dateField: string;
    @TimeField()
        timeField: string;
    @DateTimeField()
        dateTimeField: string;

    constructor(data?: Partial<ModelWithAllScalarFields>) {
        Object.assign(this, data);
    }

    userMethod1() {}
}

export function getModelManager() {
    const modelManager = new ModelManager();
    modelManager.registerBackend('default', new InMemoryBackend());
    modelManager.register(User);
    modelManager.register(Post);
    modelManager.register(Comment);
    modelManager.register(UnrelatedModel);
    modelManager.register(ModelWithUnknownField, { fields: [
        new UnknownField('unknownField')
    ]});
    modelManager.register(ModelWithAllScalarFields);
    return modelManager;
}
