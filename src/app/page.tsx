'use client'

import { Toaster } from 'sonner'
import InputForm from './components/InputForm'
import LabelPreview from './components/LabelPreview'

/**
 * @description 这只是个示例页面，你可以随意修改这个页面或进行全面重构
 */
export default function Home() {
	return (
		<main className="min-h-screen p-4">
			<div className="max-w-4xl mx-auto">
				<h1 className="text-2xl font-bold mb-4">标签自动排版助手</h1>
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div className="bg-white rounded-lg shadow">
						<InputForm />
					</div>
					<div className="bg-white rounded-lg shadow">
						<LabelPreview />
					</div>
				</div>
			</div>
			<Toaster />
		</main>
	)
}
