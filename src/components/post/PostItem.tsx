import { IPostItem } from '@/types';

interface IProps {
  post: IPostItem;
}

const handleDelete = () => {
  // Delete post
};

const handleUpdate = () => {
  // Update post
};

export const PostItem = ({ post }: IProps) => {
  return (
    <div className="card">
      <div className="card-body">
        <h5 className="card-title">{post.title}</h5>
        <div className="form-check">
          <input
            className="form-check-input"
            type="checkbox"
            value=""
            id="defaultCheck1"
            checked={post.isPublished}
          />
          <label className="form-check-label" htmlFor="defaultCheck1">
            Published
          </label>
        </div>
        <p className="card-text">{post.summary}</p>

        <button className="btn btn-primary mr-2" onClick={handleUpdate}>
          Update
        </button>
        <button className="btn btn-danger" onClick={handleDelete}>
          Delete
        </button>
      </div>
    </div>
  );
};
