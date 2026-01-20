import { useEffect, useState } from 'react'
import { api } from '../api'
import { Profile } from './Profile'

type Post = {
	id: number
	title: string
	body: string
	locked: boolean
	createdAt: string
	author?: { id: number; name: string }
}

type Comment = {
	id: number
	body: string
	createdAt: string
	author?: { id: number; name: string }
}

export function Posts() {
	const [posts, setPosts] = useState<Post[]>([])
	const [selectedPostId, setSelectedPostId] = useState<number | null>(null)
	const [selectedPost, setSelectedPost] = useState<Post | null>(null)
	const [comments, setComments] = useState<Comment[]>([])

	const [title, setTitle] = useState('')
	const [body, setBody] = useState('')

	const [commentBody, setCommentBody] = useState('')

	const [error, setError] = useState('')
	const [profileUserId, setProfileUserId] = useState<number | null>(null)

	async function loadPosts() {
		setError('')
		try {
			const data = await api('/posts')
			setPosts(data)
		} catch (err: unknown) {
			setError(err instanceof Error ? err.message : 'Failed to load posts')
		}
	}

	async function createPost(e: React.FormEvent) {
		e.preventDefault()
		setError('')
		try {
			await api('/posts', {
				method: 'POST',
				body: JSON.stringify({ title, body }),
			})
			setTitle('')
			setBody('')
			await loadPosts()
		} catch (err: unknown) {
			setError(err instanceof Error ? err.message : 'Failed to create post')
		}
	}

	async function openPost(postId: number) {
		setError('')
		setSelectedPostId(postId)

		try {
			// ожидаем, что backend отдаёт { post, comments } или просто пост с comments
			const data = await api(`/posts/${postId}`)

			// поддержим оба варианта:
			const post = data.post ?? data
			const comms = data.comments ?? data.comments ?? post.comments ?? []

			setSelectedPost(post)
			setComments(comms)
		} catch (err: unknown) {
			setError(err instanceof Error ? err.message : 'Failed to load post')
		}
	}

	async function addComment(e: React.FormEvent) {
		e.preventDefault()
		if (!selectedPostId) return

		setError('')
		try {
			await api(`/posts/${selectedPostId}/comments`, {
				method: 'POST',
				body: JSON.stringify({ body: commentBody }),
			})
			setCommentBody('')
			await openPost(selectedPostId) // перезагрузим пост/комменты
			await loadPosts() // чтобы обновилось locked и т.п.
		} catch (err: unknown) {
			setError(err instanceof Error ? err.message : 'Failed to add comment')
		}
	}

	async function lockPost() {
		if (!selectedPostId) return

		setError('')
		try {
			await api(`/posts/${selectedPostId}/lock`, { method: 'POST' })
			await openPost(selectedPostId)
			await loadPosts()
		} catch (err: unknown) {
			setError(err instanceof Error ? err.message : 'Failed to lock post')
		}
	}

	useEffect(() => {
		const initPosts = async () => {
			await loadPosts()
		}
		void initPosts()
	}, [])

	return (
		<div>
			<h2>Posts</h2>

			<button onClick={loadPosts}>Refresh posts</button>

			<hr />

			<h3>Create post</h3>
			<form onSubmit={createPost}>
				<div>
					<input
						placeholder='title'
						value={title}
						onChange={e => setTitle(e.target.value)}
					/>
				</div>

				<div>
					<textarea
						placeholder='body'
						value={body}
						onChange={e => setBody(e.target.value)}
					/>
				</div>

				<button type='submit'>Create</button>
			</form>

			<hr />

			<h3>List</h3>
			{posts.length === 0 ? (
				<p>No posts yet</p>
			) : (
				<ul>
					{posts.map(p => (
						<li key={p.id}>
							<b>{p.title}</b> {p.locked ? '(locked)' : ''}{' '}
							{p.author ? <span>by {p.author.name}</span> : null}{' '}
							<button onClick={() => openPost(p.id)}>Open</button>{' '}
							{p.author ? (
								<button onClick={() => setProfileUserId(p.author!.id)}>
									View profile
								</button>
							) : null}
						</li>
					))}
				</ul>
			)}

			<hr />

			<h3>Selected post</h3>
			{!selectedPost ? (
				<p>Select a post (Open)</p>
			) : (
				<div>
					<p>
						<b>{selectedPost.title}</b> {selectedPost.locked ? '(locked)' : ''}
					</p>
					<p>{selectedPost.body}</p>
					<p>Author: {selectedPost.author?.name || 'Unknown'}</p>

					<button onClick={lockPost} disabled={selectedPost.locked}>
						Lock post
					</button>

					<hr />

					<h4>Comments</h4>
					{comments.length === 0 ? (
						<p>No comments</p>
					) : (
						<ul>
							{comments.map(c => (
								<li key={c.id}>
									<b>{c.author?.name || 'Unknown'}:</b> {c.body}
								</li>
							))}
						</ul>
					)}

					<h4>Add comment</h4>
					<form onSubmit={addComment}>
						<input
							placeholder='comment text'
							value={commentBody}
							onChange={e => setCommentBody(e.target.value)}
						/>
						<button type='submit' disabled={selectedPost.locked}>
							Add
						</button>
					</form>

					{selectedPost.locked && (
						<p style={{ color: 'gray' }}>Post is locked, comments disabled.</p>
					)}
				</div>
			)}

			<hr />

			<h3>User Profile</h3>
			{profileUserId ? (
				<Profile userId={profileUserId} />
			) : (
				<p>Click "View profile" on a post to see user details</p>
			)}

			{error && <p style={{ color: 'red' }}>{error}</p>}
		</div>
	)
}
