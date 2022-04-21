export type Category = {
  name: string;
  parent?: string;
  _id: string;
};

export type Tag = {
  name: string;
  _id: string;
};

export type Props = {
  models: {
    Category: Category[];
    Tag: Tag[];
  };
};
