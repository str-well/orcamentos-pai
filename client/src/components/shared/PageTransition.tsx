import { motion } from "framer-motion";
import { ReactNode } from "react";

export function PageTransition({ children }: { children: ReactNode }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{
                duration: 0.5,
                ease: [0.43, 0.13, 0.23, 0.96],
                opacity: { duration: 0.6 },
                y: { duration: 0.6 }
            }}
        >
            {children}
        </motion.div>
    );
} 