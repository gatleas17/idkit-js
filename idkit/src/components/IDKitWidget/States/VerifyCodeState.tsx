import { motion } from 'framer-motion'
import { useMemo, useRef } from 'react'
import useIDKitStore from '@/store/idkit'
import { DEFAULT_COPY } from '@/types/config'
import type { IDKitStore } from '@/store/idkit'
import WorldIDIcon from '@/components/WorldIDIcon'
import ResendButton from '@/components/ResendButton'
import SMSCodeInput from '@/components/SMSCodeInput'
import { ErrorState, IDKITStage, SignalType } from '@/types'
import { isVerifyCodeError, verifyCode } from '@/services/phone'

const getParams = ({
	processing,
	phoneNumber,
	code,
	stringifiedActionId,
	setStage,
	setProcessing,
	setCode,
	copy,
	onSuccess,
	setErrorState,
	errorState,
}: IDKitStore) => ({
	processing,
	phoneNumber,
	code,
	stringifiedActionId,
	errorState,
	setCode,
	setErrorState,
	copy,
	onSubmit: async () => {
		try {
			setErrorState(null)
			setProcessing(true)
			// FIXME: Add ph_distinct_id
			const { nullifier_hash, ...proof_payload } = await verifyCode(phoneNumber, code, stringifiedActionId, '')
			onSuccess({ signal_type: SignalType.Phone, nullifier_hash, proof_payload })
		} catch (error) {
			setProcessing(false)
			setCode('')
			if (isVerifyCodeError(error)) {
				setErrorState(ErrorState.INVALID_CODE)
				console.error(error)
			} else {
				setStage(IDKITStage.ERROR)
			}
		}
	},
	useWorldID: () => setStage(IDKITStage.WORLD_ID),
})

const VerifyCodeState = () => {
	const submitRef = useRef<HTMLButtonElement>(null)
	const { copy, processing, code, onSubmit, useWorldID, errorState } = useIDKitStore(getParams)

	const animation = useMemo(() => {
		if (!processing && errorState) {
			return { x: [0, -16, 16, -8, 8, 0] }
		}
	}, [processing, errorState])

	return (
		<div className="space-y-6">
			<div>
				<p className="text-center text-2xl font-semibold text-gray-900 dark:text-white">
					Enter your 6-digit code to complete the verification.
				</p>
				{/* eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing */}
				<p className="text-70868f mt-2 text-center">{copy?.subheading || DEFAULT_COPY.subheading}</p>
			</div>
			<form className="mt-2 space-y-2">
				<motion.div animate={animation} transition={{ type: 'spring', stiffness: 30 }}>
					<SMSCodeInput submitRef={submitRef} disabled={processing} />
				</motion.div>
				<p className="text-70868f text-center text-xs">
					{errorState ? (
						<span className="text-red-400">That code is invalid. Please try again.</span>
					) : (
						'Did not receive a code?'
					)}{' '}
					<ResendButton /> or{' '}
					<button type="button" className="font-medium text-indigo-600">
						Call me
					</button>
				</p>
			</form>
			<div className="flex items-center justify-center space-x-1">
				<div className="flex items-center space-x-2">
					<WorldIDIcon width={24} height={24} />
					<p className="text-70868f font-medium">I have World ID</p>
				</div>
				<span className="font-medium text-gray-400">&bull;</span>
				<button
					type="button"
					onClick={useWorldID}
					className="bg-gradient-to-r from-[#FF6848] to-[#4940E0] bg-clip-text font-medium text-transparent"
				>
					Verify human
				</button>
			</div>
			<div className="mt-4 flex justify-center">
				<motion.button
					layoutId="submit-button"
					type="button"
					animate={{ opacity: code ? 1 : 0.4 }}
					transition={{ layout: { duration: 0.15 } }}
					onClick={onSubmit}
					disabled={!code || processing}
					ref={submitRef}
					className="inline-flex w-full items-center justify-center rounded-2xl border border-transparent bg-indigo-600 px-8 py-4 font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-indigo-600"
				>
					<motion.span transition={{ layout: { duration: 0.15 } }} layoutId="button-text">
						Continue
					</motion.span>
				</motion.button>
			</div>
		</div>
	)
}

export default VerifyCodeState