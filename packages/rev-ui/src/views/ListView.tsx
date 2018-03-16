
import * as React from 'react';
import * as PropTypes from 'prop-types';

import { IModelProviderContext } from '../provider/ModelProvider';
import { IModelMeta, IModelOperationResult, IModel, fields } from 'rev-models';
import { IReadMeta } from 'rev-models/lib/models/types';
import { UI_COMPONENTS } from '../config';

export interface IListViewProps {
    model: string;
    fields: string[];
    related?: string[];
    title?: string;
    where?: object;
    orderBy?: string[];
    limit?: number;

    onRecordPress?: (model: IModel) => void;

    component?: React.ComponentType<IListViewComponentProps>;
}

export type IListViewLoadState = 'loading' | 'loaded' | 'load_error';

export interface IListViewComponentProps {
    title: string;
    loadState: IListViewLoadState;
    fields: fields.Field[];
    records: IModel[];
    firstRecordNumber: number;
    lastRecordNumber: number;
    totalCount: number;
    backButtonDisabled: boolean;
    forwardButtonDisabled: boolean;

    onBackButtonPress(): void;
    onForwardButtonPress(): void;
    onRecordPress(model: IModel): void;
}

export interface IListViewState {
    loadState: IListViewLoadState;
    modelData?: IModelOperationResult<any, IReadMeta>;
    where: object;
    related: string[];
    orderBy: string[];
    limit: number;
    offset: number;
}

export class ListView extends React.Component<IListViewProps, IListViewState> {

    context: IModelProviderContext;
    static contextTypes = {
        modelManager: PropTypes.object,
    };

    modelMeta: IModelMeta<any>;

    constructor(props: IListViewProps, context: any) {
        super(props, context);
        this.context.modelManager = context.modelManager;
        if (!this.context.modelManager) {
            throw new Error('ListView Error: must be nested inside a ModelProvider.');
        }
        if (!props.model || !this.context.modelManager.isRegistered(props.model)) {
            throw new Error(`ListView Error: Model '${props.model}' is not registered.`);
        }
        this.modelMeta = this.context.modelManager.getModelMeta(this.props.model);
        for (const fieldName of props.fields) {
            const field = this.modelMeta.fieldsByName[fieldName];
            if (!field) {
                throw new Error(`ListView Error: Model '${props.model}' does not have a field called '${fieldName}'.`);
            }
            else if (field instanceof fields.RelatedModelFieldBase) {
                if (field instanceof fields.RelatedModelField) {
                    if (!props.related || props.related.indexOf(field.name) == -1) {
                        throw new Error(`To render the related model field '${fieldName}', it must be included in the "related" prop of the ListView.`);
                    }
                }
                else {
                    throw new Error(`Related model field '${fieldName}' is invalid. Only RelatedModel fields are supported in ListViews currently.`);
                }
            }
        }

        this.state = {
            loadState: 'loading',
            where: props.where || {},
            related: props.related || null,
            orderBy: props.orderBy || null,
            limit: props.limit || 20,
            offset: 0,
        };
    }

    onForwardButtonPress() {
        this.loadData(this.state.limit, this.state.offset + this.state.limit);
    }

    onBackButtonPress() {
        const offset = Math.max(this.state.offset - this.state.limit, 0);
        this.loadData(this.state.limit, offset);
    }

    onRecordPress(record: IModel) {
        if (this.props.onRecordPress) {
            this.props.onRecordPress(record);
        }
    }

    async loadData(limit: number, offset: number) {
        this.setState({
            loadState: 'loading'
        });
        const modelData = await this.context.modelManager.read(
            this.modelMeta.ctor,
            {
                where: this.state.where,
                related: this.state.related,
                orderBy: this.state.orderBy,
                limit,
                offset,
            });
        if (modelData.success && modelData.results) {
            this.setState({
                loadState: 'loaded',
                modelData,
                limit,
                offset
            });
        }
    }

    render() {

        const listFields = this.props.fields.map((fieldName) => this.modelMeta.fieldsByName[fieldName]);

        const cProps: IListViewComponentProps & {children?: any} = {
            loadState: this.state.loadState,
            title: this.props.title ? this.props.title : this.modelMeta.label + ' List',
            fields: listFields,
            records: [],
            firstRecordNumber: 0,
            lastRecordNumber: 0,
            totalCount: 0,
            backButtonDisabled: true,
            forwardButtonDisabled: true,

            onBackButtonPress: () => this.onBackButtonPress(),
            onForwardButtonPress: () => this.onForwardButtonPress(),
            onRecordPress: (record: IModel) => this.onRecordPress(record)
        };

        if (this.state.loadState == 'loaded') {
            const readMeta = this.state.modelData.meta;
            cProps.firstRecordNumber = readMeta.totalCount ? readMeta.offset + 1 : 0;
            cProps.lastRecordNumber = Math.min(
                readMeta.offset + readMeta.limit,
                readMeta.totalCount
            );
            if (cProps.lastRecordNumber < readMeta.totalCount) {
                cProps.forwardButtonDisabled = false;
            }
            if (cProps.firstRecordNumber > 1) {
                cProps.backButtonDisabled = false;
            }
            cProps.totalCount = readMeta.totalCount;
            cProps.records = this.state.modelData.results;
        }

        const Component = this.props.component || UI_COMPONENTS.views.ListView;
        return <Component {...cProps} />;
    }

    async componentDidMount() {
        if (lifecycleOptions.enableComponentDidMount) {
            this.loadData(this.state.limit, this.state.offset);
        }
    }

}

export const lifecycleOptions = {
    enableComponentDidMount: true
};
