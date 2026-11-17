import * as UiReact from 'tinybase/ui-react/with-schemas';
import {type NoValuesSchema} from 'tinybase/with-schemas';
import {TABLES_SCHEMA} from './storeData';
import {STORE_ID, createTodosStore, type TodoRow} from './storeData';
import {createLocalPersister} from 'tinybase/persisters/persister-browser/with-schemas';

type Schemas = [typeof TABLES_SCHEMA, NoValuesSchema];

const {
  useAddRowCallback,
  useCreateMergeableStore,
  useCreatePersister,
  useDelRowCallback,
  useProvideStore,
  useRow,
  useSetPartialRowCallback,
  useSortedRowIds,
} = UiReact as UiReact.WithSchemas<Schemas>;

export {STORE_ID};
export type {TodoRow};
export {
  useAddRowCallback,
  useDelRowCallback,
  useRow,
  useSortedRowIds,
  useSetPartialRowCallback,
};

export const Store = ({onReady}: {onReady?: () => void}) => {
  const store = useCreateMergeableStore(() => createTodosStore());

  useProvideStore(STORE_ID, store);

  useCreatePersister(
    store,
    (store) => createLocalPersister(store, STORE_ID),
    [],
    async (persister) => {
      await persister.load();
      await persister.startAutoSave();
      onReady?.();
    },
  );

  return null;
};
